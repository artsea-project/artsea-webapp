import { and, eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/db"
import { artPieces, media } from "@/db/schema"
import { isMediaType, mediaHeaders, parseByteRange } from "@/lib/media"
import type { MediaType } from "@/lib/media"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function notFound() {
    return new NextResponse(null, { status: 404 })
}

function hasSupportedMediaType<T extends { fileType: string }>(
    record: T
): record is T & { fileType: MediaType } {
    return isMediaType(record.fileType)
}

export function mediaResponse(record: { content: Buffer; contentHash: string; fileType: string }) {
    if (!hasSupportedMediaType(record)) {
        return notFound()
    }

    return new NextResponse(new Uint8Array(record.content), {
        headers: mediaHeaders(record),
    })
}

function hasMatchingEtag(ifNoneMatch: string | null, contentHash: string) {
    return ifNoneMatch === `"${contentHash}"`
}

function acceptsRange(ifRange: string | null, contentHash: string) {
    return ifRange === null || ifRange === `"${contentHash}"`
}

export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
    const { mediaId } = await params

    if (!UUID_PATTERN.test(mediaId)) {
        return notFound()
    }

    const [metadata] = await db
        .select({
            contentHash: media.contentHash,
            fileType: media.fileType,
            size: sql<number>`octet_length(${media.content})`,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(and(eq(media.mediaId, mediaId), eq(artPieces.isVisible, true)))

    if (!metadata || !hasSupportedMediaType(metadata)) {
        return notFound()
    }

    if (hasMatchingEtag(request.headers.get("if-none-match"), metadata.contentHash)) {
        return new NextResponse(null, {
            status: 304,
            headers: mediaHeaders(metadata),
        })
    }

    const range = acceptsRange(request.headers.get("if-range"), metadata.contentHash)
        ? parseByteRange(request.headers.get("range"), metadata.size)
        : null

    if (range === "unsatisfiable") {
        return new NextResponse(null, {
            status: 416,
            headers: { ...mediaHeaders(metadata), "Content-Range": `bytes */${metadata.size}` },
        })
    }

    if (range) {
        const [slice] = await db
            .select({
                content: sql<Buffer>`substring(${media.content} from ${range.start + 1} for ${range.end - range.start + 1})`,
            })
            .from(media)
            .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
            .where(and(eq(media.mediaId, mediaId), eq(artPieces.isVisible, true)))

        if (!slice) return notFound()

        return new NextResponse(new Uint8Array(slice.content), {
            status: 206,
            headers: {
                ...mediaHeaders({ ...metadata, content: slice.content }),
                "Content-Range": `bytes ${range.start}-${range.end}/${metadata.size}`,
            },
        })
    }

    const [record] = await db
        .select({
            content: media.content,
            contentHash: media.contentHash,
            fileType: media.fileType,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(and(eq(media.mediaId, mediaId), eq(artPieces.isVisible, true)))

    return record ? mediaResponse(record) : notFound()
}
