import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, media } from "@/db/schema"
import { serveMedia } from "@/lib/media"

async function loadPublicMediaMetadata(mediaId: string) {
    const [metadata] = await db
        .select({
            contentHash: media.contentHash,
            fileType: media.fileType,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(and(eq(media.mediaId, mediaId), eq(artPieces.isVisible, true)))

    return metadata
}

async function loadPublicMediaRecord(mediaId: string) {
    const [record] = await db
        .select({
            content: media.content,
            contentHash: media.contentHash,
            fileType: media.fileType,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(and(eq(media.mediaId, mediaId), eq(artPieces.isVisible, true)))

    return record
}

export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
    const { mediaId } = await params
    return serveMedia(request, mediaId, loadPublicMediaMetadata, loadPublicMediaRecord)
}
