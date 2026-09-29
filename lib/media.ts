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
