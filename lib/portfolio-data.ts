import { and, asc, eq } from "drizzle-orm"
import { cacheLife } from "next/cache"

import { db } from "@/db"
import { artPieces, artPieceTags, categories, media, tags } from "@/db/schema"
import { resolveLocalizedLabel } from "@/lib/localized-labels"
import { isMediaType } from "@/lib/media"
import { readMediaDimensions, type MediaDimensions } from "@/lib/media-dimensions"
import {
    buildPortfolioView,
    collectTagsByCategory,
    parsePortfolioQuery,
    removeDuplicatesAndSort,
    type PortfolioArtwork,
    type PortfolioCard,
    type PortfolioView,
    type RawSearchParams,
    type TagsByCategory,
} from "@/lib/portfolio"

const isVisible = eq(artPieces.isVisible, true)

type ArtworkRow = Awaited<ReturnType<typeof selectVisibleArtworks>>[number]
type CoverRow = Awaited<ReturnType<typeof selectFirstMediaOfVisibleArtworks>>[number]
type TagRow = Awaited<ReturnType<typeof selectTagsOfVisibleArtworks>>[number]

function selectVisibleArtworks() {
    return db
        .select({
            artPieceId: artPieces.artPieceId,
            titlePln: artPieces.titlePln,
            titleEng: artPieces.titleEng,
            year: artPieces.yearOfExecution,
            uploadedAt: artPieces.uploadedAt,
            category: categories.namePln,
        })
        .from(artPieces)
        .innerJoin(categories, eq(artPieces.categoryId, categories.categoryId))
        .where(isVisible)
}

// The cover is the media with the lowest order_index
function selectFirstMediaOfVisibleArtworks() {
    return db
        .selectDistinctOn([media.artPieceId], {
            artPieceId: media.artPieceId,
            mediaId: media.mediaId,
            fileType: media.fileType,
            contentHash: media.contentHash,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(isVisible)
        .orderBy(asc(media.artPieceId), asc(media.orderIndex), asc(media.mediaId))
}

function selectTagsOfVisibleArtworks() {
    return db
        .select({
            artPieceId: artPieceTags.artPieceId,
            namePln: tags.namePln,
            nameEng: tags.nameEng,
        })
        .from(artPieceTags)
        .innerJoin(tags, eq(artPieceTags.tagId, tags.tagId))
        .innerJoin(artPieces, eq(artPieceTags.artPieceId, artPieces.artPieceId))
        .where(isVisible)
}

function groupTagNamesByArtwork(tagRows: TagRow[]) {
    const tagsByArtwork = new Map<string, string[]>()

    for (const tag of tagRows) {
        const name = resolveLocalizedLabel(tag.namePln, tag.nameEng, "")
        if (!name) continue

        const names = tagsByArtwork.get(tag.artPieceId) ?? []
        names.push(name)
        tagsByArtwork.set(tag.artPieceId, names)
    }

    return tagsByArtwork
}

function toPortfolioArtwork(
    artwork: ArtworkRow,
    cover: CoverRow,
    tagNames: string[]
): PortfolioArtwork {
    return {
        artPieceId: artwork.artPieceId,
        title: resolveLocalizedLabel(artwork.titlePln, artwork.titleEng, "Bez tytułu"),
        year: artwork.year,
        uploadedAt: artwork.uploadedAt,
        category: artwork.category,
        tags: removeDuplicatesAndSort(tagNames),
        cover: { mediaId: cover.mediaId, fileType: cover.fileType, contentHash: cover.contentHash },
    }
}

// Not cached on purpose: when the artist adds or hides a work, visitors should see it right away
export async function loadPortfolioArtworks(): Promise<PortfolioArtwork[]> {
    const [artworkRows, coverRows, tagRows] = await Promise.all([
        selectVisibleArtworks(),
        selectFirstMediaOfVisibleArtworks(),
        selectTagsOfVisibleArtworks(),
    ])

    const coverByArtwork = new Map(coverRows.map((cover) => [cover.artPieceId, cover]))
    const tagsByArtwork = groupTagNamesByArtwork(tagRows)

    return artworkRows.flatMap((artwork) => {
        const cover = coverByArtwork.get(artwork.artPieceId)

        if (!cover || !isMediaType(cover.fileType)) return []

        return [toPortfolioArtwork(artwork, cover, tagsByArtwork.get(artwork.artPieceId) ?? [])]
    })
}

export type PortfolioPage = Omit<PortfolioView, "items"> & {
    cards: PortfolioCard[]
    tagsByCategory: TagsByCategory
}

const FALLBACK_DIMENSIONS: MediaDimensions = { width: 1, height: 1 }

export async function getMediaDimensions(
    mediaId: string,
    contentHash: string
): Promise<MediaDimensions> {
    "use cache"

    // contentHash is part of the cache key and a new file gets a new hash,
    // so the parsed size never goes stale and can be cached forever
    cacheLife("max")

    const [record] = await db
        .select({ content: media.content, fileType: media.fileType })
        .from(media)
        .where(and(eq(media.mediaId, mediaId), eq(media.contentHash, contentHash)))

    if (!record || !isMediaType(record.fileType)) return FALLBACK_DIMENSIONS
    return readMediaDimensions(record.content, record.fileType) ?? FALLBACK_DIMENSIONS
}

export async function getPortfolioPage(params: RawSearchParams): Promise<PortfolioPage> {
    const artworks = await loadPortfolioArtworks()
    const { items, ...view } = buildPortfolioView(artworks, parsePortfolioQuery(params))
    const dimensions = await Promise.all(
        items.map((item) => getMediaDimensions(item.cover.mediaId, item.cover.contentHash))
    )

    return {
        ...view,
        cards: items.map((item, index) => ({ ...item, ...dimensions[index] })),
        tagsByCategory: collectTagsByCategory(artworks),
    }
}
