import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, artPieceTags, categories, media, tags } from "@/db/schema"
import { orderBentoLabels, resolveLocalizedLabel } from "@/lib/localized-labels"
import { isMediaType } from "@/lib/media"
import type { PortfolioArtwork } from "@/lib/portfolio"

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
        tags: orderBentoLabels([...new Set(tagNames)]),
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
