import { and, asc, eq, inArray } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { artPieces, artPieceTags, media, siteSettings, tags } from "@/db/schema"
import type { Locale } from "@/i18n/routing"
import { DESKTOP_GRID, MOBILE_GRID } from "@/lib/bento-grid"
import { normalizeBentoLayout } from "@/lib/bento-layout"
import { localizedKey } from "@/lib/i18n/localized-key"
import { isBentoMediaType } from "@/lib/media"
import type { BentoBoxLayout, BentoLayoutItem } from "@/types/bento"

export const BENTO_CACHE_TAG = "bento-artworks"

export type BentoCardData = BentoLayoutItem & {
    title: string | null
    year: number | null
    tags: string[]
}

export type BentoData = {
    desktop: BentoCardData[]
    mobile: BentoCardData[]
}

type LayoutName = keyof BentoData

export function orderBentoLabels(labels: string[], locale: Locale) {
    return [...labels].sort((left, right) => left.localeCompare(right, locale))
}

async function loadBentoData(locale: Locale): Promise<BentoData> {
    "use cache"

    cacheLife("max")
    cacheTag(BENTO_CACHE_TAG)

    const [settings] = await db
        .select({ layoutBentoBox: siteSettings.layoutBentoBox })
        .from(siteSettings)
        .orderBy(asc(siteSettings.siteSettingsId))
        .limit(1)

    if (!settings?.layoutBentoBox) return { desktop: [], mobile: [] }

    const layout = settings.layoutBentoBox as BentoBoxLayout
    const normalized = {
        desktop: normalizeBentoLayout(layout.desktop, DESKTOP_GRID),
        mobile: normalizeBentoLayout(layout.mobile, MOBILE_GRID),
    } satisfies Record<LayoutName, BentoLayoutItem[]>
    const artworkIds = [
        ...new Set(
            Object.values(normalized)
                .flat()
                .map((item) => item.artPieceId)
        ),
    ]
    const mediaIds = [
        ...new Set(
            Object.values(normalized)
                .flat()
                .map((item) => item.mediaId)
        ),
    ]

    if (artworkIds.length === 0 || mediaIds.length === 0) return { desktop: [], mobile: [] }

    const [artworkRows, mediaRows, tagRows] = await Promise.all([
        db
            .select({
                artPieceId: artPieces.artPieceId,
                title: artPieces[localizedKey("title", locale)],
                year: artPieces.yearOfExecution,
            })
            .from(artPieces)
            .where(and(inArray(artPieces.artPieceId, artworkIds), eq(artPieces.isVisible, true))),
        db
            .select({
                mediaId: media.mediaId,
                artPieceId: media.artPieceId,
                fileType: media.fileType,
            })
            .from(media)
            .where(inArray(media.mediaId, mediaIds)),
        db
            .select({
                artPieceId: artPieceTags.artPieceId,
                name: tags[localizedKey("name", locale)],
            })
            .from(artPieceTags)
            .innerJoin(tags, eq(artPieceTags.tagId, tags.tagId))
            .where(inArray(artPieceTags.artPieceId, artworkIds)),
    ])

    const artworksById = new Map(artworkRows.map((artwork) => [artwork.artPieceId, artwork]))
    const mediaById = new Map(mediaRows.map((item) => [item.mediaId, item]))
    const tagsByArtwork = new Map<string, string[]>()
    for (const { artPieceId, name } of tagRows) {
        if (name) tagsByArtwork.set(artPieceId, [...(tagsByArtwork.get(artPieceId) ?? []), name])
    }
    for (const [artPieceId, tagNames] of tagsByArtwork) {
        tagsByArtwork.set(artPieceId, orderBentoLabels(tagNames, locale))
    }

    const cardsFor = (name: LayoutName) =>
        normalized[name].flatMap((item) => {
            const artwork = artworksById.get(item.artPieceId)
            const selectedMedia = mediaById.get(item.mediaId)
            if (
                !artwork ||
                !selectedMedia ||
                selectedMedia.artPieceId !== item.artPieceId ||
                !isBentoMediaType(selectedMedia.fileType)
            ) {
                return []
            }

            return [
                {
                    ...item,
                    title: artwork.title || null,
                    year: artwork.year,
                    tags: tagsByArtwork.get(item.artPieceId) ?? [],
                },
            ]
        })

    return { desktop: cardsFor("desktop"), mobile: cardsFor("mobile") }
}

export async function getBentoData(locale: Locale): Promise<BentoData> {
    return loadBentoData(locale)
}
