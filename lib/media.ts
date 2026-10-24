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
