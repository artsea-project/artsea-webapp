import { asc } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, media } from "@/db/schema"
import type { ThemeDraft } from "@/lib/appearance/theme-editor-state"
import type { ArtworkCatalog } from "@/lib/appearance/validation"
import { DESKTOP_GRID, MOBILE_GRID } from "@/lib/bento-grid"
import { normalizeBentoLayout } from "@/lib/bento-layout"
import { isBentoMediaType } from "@/lib/media"
import { isRecord } from "@/lib/theme/record"
import { isHexColor } from "@/lib/theme/colors"
import { isSelectableFontName } from "@/lib/theme/fonts"
import { defaultSiteTheme } from "@/lib/theme/theme"
import type { BentoBoxLayout } from "@/types/bento"

export type ArtworkMeta = { title: string | null; isVisible: boolean }

export type PickerArtwork = { artPieceId: string; title: string | null; mediaIds: string[] }

export type AppearanceData = {
    layout: BentoBoxLayout
    /** Title and visibility of every work, keyed by art piece id. */
    artworkMeta: Record<string, ArtworkMeta>
    artworks: PickerArtwork[]
    theme: ThemeDraft
}

type ArtworkRecord = {
    artPieceId: string
    title: string | null
    isVisible: boolean
    mediaIds: string[]
}

/** Every work with its tile-capable images (no video), images in their gallery order. */
async function loadArtworkRecords(): Promise<ArtworkRecord[]> {
    const [artworkRows, mediaRows] = await Promise.all([
        db
            .select({
                artPieceId: artPieces.artPieceId,
                title: artPieces.titlePln,
                isVisible: artPieces.isVisible,
            })
            .from(artPieces),
        db
            .select({
                mediaId: media.mediaId,
                artPieceId: media.artPieceId,
                fileType: media.fileType,
            })
            .from(media)
            .orderBy(asc(media.orderIndex)),
    ])

    return artworkRows.map((artwork) => ({
        ...artwork,
        title: artwork.title?.trim() || null,
        mediaIds: mediaRows
            .filter(
                (row) => row.artPieceId === artwork.artPieceId && isBentoMediaType(row.fileType)
            )
            .map((row) => row.mediaId),
    }))
}

function toCatalog(records: ArtworkRecord[]): ArtworkCatalog {
    return {
        visibleArtPieceIds: new Set(
            records.filter((record) => record.isVisible).map((record) => record.artPieceId)
        ),
        mediaArtPiece: new Map(
            records.flatMap((record) =>
                record.mediaIds.map((mediaId) => [mediaId, record.artPieceId] as const)
            )
        ),
    }
}

export async function getArtworkCatalog(): Promise<ArtworkCatalog> {
    return toCatalog(await loadArtworkRecords())
}

async function loadSiteSettings() {
    return db.query.siteSettings.findFirst({
        columns: { theme: true, layoutBentoBox: true },
    })
}

/**
 * Drops tiles whose work or image no longer exists, and tiles present in only one view, so the
 * editor always starts from one shared set of tiles.
 */
function usableLayout(layout: unknown, catalog: ArtworkCatalog): BentoBoxLayout {
    const value = isRecord(layout) ? layout : {}
    const desktop = normalizeBentoLayout(value.desktop, DESKTOP_GRID)
    const mobile = normalizeBentoLayout(value.mobile, MOBILE_GRID)
    const isUsable = (item: (typeof desktop)[number]) =>
        catalog.mediaArtPiece.get(item.mediaId) === item.artPieceId
    const mobileIds = new Set(mobile.filter(isUsable).map((item) => item.tileId))
    const shared = new Set(
        desktop
            .filter((item) => isUsable(item) && mobileIds.has(item.tileId))
            .map((item) => item.tileId)
    )

    return {
        desktop: { items: desktop.filter((item) => shared.has(item.tileId)) },
        mobile: { items: mobile.filter((item) => shared.has(item.tileId)) },
    }
}

function resolveThemeDraft(theme: unknown): ThemeDraft {
    const value = isRecord(theme) ? theme : {}
    const fonts = isRecord(value.fonts) ? value.fonts : {}
    const colors = isRecord(value.colors) ? value.colors : {}
    const pick = <T extends Record<string, string>>(
        source: Record<string, unknown>,
        fallback: T,
        isValid: (candidate: unknown) => boolean
    ) =>
        Object.fromEntries(
            Object.entries(fallback).map(([key, defaultValue]) => [
                key,
                isValid(source[key]) ? source[key] : defaultValue,
            ])
        ) as T

    return {
        fonts: pick(fonts, defaultSiteTheme.fonts, isSelectableFontName),
        colors: pick(colors, defaultSiteTheme.colors, isHexColor),
    }
}

function sortByTitle(left: PickerArtwork, right: PickerArtwork): number {
    if (left.title === right.title) return 0
    if (left.title === null) return 1
    if (right.title === null) return -1
    return left.title.localeCompare(right.title, "pl")
}

export async function getAppearanceData(): Promise<AppearanceData> {
    const [records, settings] = await Promise.all([loadArtworkRecords(), loadSiteSettings()])
    const catalog = toCatalog(records)
    const layout = usableLayout(settings?.layoutBentoBox, catalog)

    const artworkMeta = Object.fromEntries(
        records.map(({ artPieceId, title, isVisible }) => [artPieceId, { title, isVisible }])
    )

    const artworks = records
        .filter((record) => record.isVisible && record.mediaIds.length > 0)
        .map(({ artPieceId, title, mediaIds }) => ({ artPieceId, title, mediaIds }))
        .sort(sortByTitle)

    return { layout, artworkMeta, artworks, theme: resolveThemeDraft(settings?.theme) }
}

export async function getSavedSiteSettings() {
    return loadSiteSettings()
}
