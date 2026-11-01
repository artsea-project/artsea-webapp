import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { mediaResponse } from "@/app/media/[mediaId]/route"
import { db } from "@/db"
import { media } from "@/db/schema"
import { isMediaType, mediaHeaders } from "@/lib/media"
import type { MediaType } from "@/lib/media"
import { isUuid } from "@/lib/works/validation"

function notFound() {
    return new NextResponse(null, { status: 404 })
}

function hasSupportedMediaType<T extends { fileType: string }>(
    record: T
): record is T & { fileType: MediaType } {
    return isMediaType(record.fileType)
}

function hasMatchingEtag(ifNoneMatch: string | null, contentHash: string) {
    return ifNoneMatch === `"${contentHash}"`
}

export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
    const { mediaId } = await params

    if (!isUuid(mediaId)) {
        return notFound()
    }

    const [metadata] = await db
        .select({
            contentHash: media.contentHash,
            fileType: media.fileType,
        })
        .from(media)
        .where(eq(media.mediaId, mediaId))

    if (!metadata || !hasSupportedMediaType(metadata)) {
        return notFound()
    }

    if (hasMatchingEtag(request.headers.get("if-none-match"), metadata.contentHash)) {
        return new NextResponse(null, {
            status: 304,
            headers: mediaHeaders(metadata),
        })
    }

    const [record] = await db
        .select({
            content: media.content,
            contentHash: media.contentHash,
            fileType: media.fileType,
        })
        .from(media)
        .where(eq(media.mediaId, mediaId))

    return record ? mediaResponse(record) : notFound()
}
