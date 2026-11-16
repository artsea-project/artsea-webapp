import { asc } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, media } from "@/db/schema"
import type { ArtworkCatalog } from "@/lib/appearance/validation"
import { isBentoMediaType } from "@/lib/media"

type ArtworkRecord = {
    artPieceId: string
    title: string | null
    isVisible: boolean
    mediaIds: string[]
}

type MediaRow = { mediaId: string; artPieceId: string; fileType: string }

function groupTileImagesByWork(rows: MediaRow[]): Map<string, string[]> {
    const imagesByWork = new Map<string, string[]>()
    for (const row of rows) {
        if (!isBentoMediaType(row.fileType)) continue
        imagesByWork.set(row.artPieceId, [...(imagesByWork.get(row.artPieceId) ?? []), row.mediaId])
    }
    return imagesByWork
}

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
    const imagesByWork = groupTileImagesByWork(mediaRows)

    return artworkRows.map((artwork) => ({
        ...artwork,
        title: artwork.title?.trim() || null,
        mediaIds: imagesByWork.get(artwork.artPieceId) ?? [],
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
