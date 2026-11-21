import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, media } from "@/db/schema"
import { serveMedia, type ByteRange } from "@/lib/media"

const isVisibleMedia = (mediaId: string) =>
    and(eq(media.mediaId, mediaId), eq(artPieces.isVisible, true))

async function loadPublicMediaMetadata(mediaId: string) {
    const [metadata] = await db
        .select({
            contentHash: media.contentHash,
            fileType: media.fileType,
            size: sql<number>`octet_length(${media.content})`,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(isVisibleMedia(mediaId))

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
        .where(isVisibleMedia(mediaId))

    return record
}

async function loadPublicMediaRange(mediaId: string, range: ByteRange) {
    const [slice] = await db
        .select({
            content: sql<Buffer>`substring(${media.content} from ${range.start + 1} for ${range.end - range.start + 1})`,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(isVisibleMedia(mediaId))

    return slice?.content
}

export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
    const { mediaId } = await params
    return serveMedia(request, mediaId, loadPublicMediaMetadata, loadPublicMediaRecord, {
        loadRange: loadPublicMediaRange,
    })
}
