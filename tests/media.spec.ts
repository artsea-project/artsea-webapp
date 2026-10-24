import { expect, test } from "@playwright/test"

import { isBentoMediaType, isMediaType, mediaHeaders, parseByteRange } from "../lib/media"

test("maps supported Bento media types to safe revalidation headers", () => {
    const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff])
    const headers = mediaHeaders({
        content,
        contentHash: "a".repeat(64),
        fileType: "png",
    })

    expect(headers).toEqual({
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Length": "6",
        "Content-Type": "image/png",
        ETag: `"${"a".repeat(64)}"`,
        "X-Content-Type-Options": "nosniff",
    })
    expect(isMediaType("jpg")).toBe(true)
    expect(isMediaType("gif")).toBe(true)
    expect(isMediaType("mp4")).toBe(true)
    expect(isBentoMediaType("jpg")).toBe(true)
    expect(isBentoMediaType("gif")).toBe(true)
    expect(isBentoMediaType("mp4")).toBe(false)
})

test("parses a single byte range against the content size", () => {
    expect(parseByteRange(null, 10)).toBeNull()
    expect(parseByteRange("bytes=0-3", 10)).toEqual({ start: 0, end: 3 })
    expect(parseByteRange("bytes=4-", 10)).toEqual({ start: 4, end: 9 })
    expect(parseByteRange("bytes=8-20", 10)).toEqual({ start: 8, end: 9 })
    expect(parseByteRange("bytes=-3", 10)).toEqual({ start: 7, end: 9 })
    expect(parseByteRange("bytes=-30", 10)).toEqual({ start: 0, end: 9 })
    expect(parseByteRange("bytes=10-", 10)).toBe("unsatisfiable")
    expect(parseByteRange("bytes=5-4", 10)).toBe("unsatisfiable")
    expect(parseByteRange("bytes=-0", 10)).toBe("unsatisfiable")
    expect(parseByteRange("bytes=-", 10)).toBeNull()
    expect(parseByteRange("bytes=0-1,4-5", 10)).toBeNull()
    expect(parseByteRange("items=0-1", 10)).toBeNull()
})
