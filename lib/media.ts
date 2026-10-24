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
        "Accept-Ranges": "bytes",
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
    size?: number
}

type MediaRangeLoader = (mediaId: string, range: ByteRange) => Promise<Buffer | undefined>
type SupportedMediaMetadata = StoredMediaMetadata & { fileType: MediaType }

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

function acceptsRange(ifRange: string | null, contentHash: string) {
    return ifRange === null || ifRange === `"${contentHash}"`
}

function unsatisfiableRange(metadata: SupportedMediaMetadata, size: number) {
    return new NextResponse(null, {
        status: 416,
        headers: { ...mediaHeaders(metadata), "Content-Range": `bytes */${size}` },
    })
}

function partialContent(
    metadata: SupportedMediaMetadata,
    range: ByteRange,
    size: number,
    content: Buffer
) {
    return new NextResponse(new Uint8Array(content), {
        status: 206,
        headers: {
            ...mediaHeaders({ ...metadata, content }),
            "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        },
    })
}

// With loadRange and a known size only the requested bytes are read,
// otherwise the range is cut from the full record.
export async function serveMedia(
    request: Request,
    mediaId: string,
    loadMetadata: (mediaId: string) => Promise<StoredMediaMetadata | undefined>,
    loadRecord: (mediaId: string) => Promise<StoredMediaRecord | undefined>,
    { loadRange }: { loadRange?: MediaRangeLoader } = {}
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

    const rangeHeader = acceptsRange(request.headers.get("if-range"), metadata.contentHash)
        ? request.headers.get("range")
        : null

    if (loadRange && metadata.size !== undefined) {
        const range = parseByteRange(rangeHeader, metadata.size)
        if (range === "unsatisfiable") return unsatisfiableRange(metadata, metadata.size)
        if (range) {
            const slice = await loadRange(mediaId, range)
            return slice ? partialContent(metadata, range, metadata.size, slice) : notFound()
        }
    }

    const record = await loadRecord(mediaId)
    if (!record) return notFound()

    const size = record.content.byteLength
    const range = parseByteRange(rangeHeader, size)
    if (range === "unsatisfiable") return unsatisfiableRange(metadata, size)
    if (range) {
        return partialContent(
            metadata,
            range,
            size,
            record.content.subarray(range.start, range.end + 1)
        )
    }
    return mediaResponse(record)
}

export type ByteRange = { start: number; end: number }

const BYTE_RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/

// Supports a single range only anything else is answered with the full content.
export function parseByteRange(
    header: string | null,
    size: number
): ByteRange | "unsatisfiable" | null {
    const match = header?.trim().match(BYTE_RANGE_PATTERN)
    if (!match) return null

    const [, startText, endText] = match
    if (!startText && !endText) return null

    if (!startText) {
        const suffixLength = Number(endText)
        if (suffixLength === 0 || size === 0) return "unsatisfiable"
        return { start: Math.max(0, size - suffixLength), end: size - 1 }
    }

    const start = Number(startText)
    const end = endText ? Math.min(Number(endText), size - 1) : size - 1
    if (start >= size || start > end) return "unsatisfiable"
    return { start, end }
}
