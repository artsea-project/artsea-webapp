import { NextResponse } from "next/server"

import { isUuid } from "@/lib/uuid"

export const MEDIA_TYPES = {
    png: "image/png",
    jpg: "image/jpeg",
    gif: "image/gif",
    mp4: "video/mp4",
} as const

export type MediaType = keyof typeof MEDIA_TYPES
export type BentoMediaType = Exclude<MediaType, "mp4">

export function isMediaType(fileType: string): fileType is MediaType {
    return fileType in MEDIA_TYPES
}

export function isBentoMediaType(fileType: string): fileType is BentoMediaType {
    return isMediaType(fileType) && fileType !== "mp4"
}

export function mediaHeaders(record: {
    content?: Buffer
    contentHash: string
    fileType: MediaType
}) {
    return {
        "Cache-Control": "public, max-age=0, must-revalidate",
        ...(record.content ? { "Content-Length": String(Buffer.byteLength(record.content)) } : {}),
        "Content-Type": MEDIA_TYPES[record.fileType],
        ETag: `"${record.contentHash}"`,
        "X-Content-Type-Options": "nosniff",
    }
}

export type StoredMediaMetadata = {
    contentHash: string
    fileType: string
}

export type StoredMediaRecord = StoredMediaMetadata & {
    content: Buffer
}

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

export function mediaResponse(record: StoredMediaRecord) {
    if (!hasSupportedMediaType(record)) {
        return notFound()
    }

    return new NextResponse(new Uint8Array(record.content), {
        headers: mediaHeaders(record),
    })
}

export async function serveMedia(
    request: Request,
    mediaId: string,
    loadMetadata: (mediaId: string) => Promise<StoredMediaMetadata | undefined>,
    loadRecord: (mediaId: string) => Promise<StoredMediaRecord | undefined>
): Promise<NextResponse> {
    if (!isUuid(mediaId)) {
        return notFound()
    }

    const metadata = await loadMetadata(mediaId)
    if (!metadata || !hasSupportedMediaType(metadata)) {
        return notFound()
    }

    if (hasMatchingEtag(request.headers.get("if-none-match"), metadata.contentHash)) {
        return new NextResponse(null, {
            status: 304,
            headers: mediaHeaders(metadata),
        })
    }

    const record = await loadRecord(mediaId)
    return record ? mediaResponse(record) : notFound()
}
