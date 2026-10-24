import { readFileSync } from "node:fs"
import path from "node:path"

import { expect, test } from "@playwright/test"

import { readMediaDimensions } from "../lib/media-dimensions"

const fixture = (name: string) => readFileSync(path.join(__dirname, "..", "db", "fixtures", name))

function atom(type: string, payload: Buffer) {
    const header = Buffer.alloc(8)
    header.writeUInt32BE(payload.length + 8, 0)
    header.write(type, 4, "latin1")
    return Buffer.concat([header, payload])
}

function trackHeader({
    version = 0,
    width,
    height,
    matrix = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000],
}: {
    version?: 0 | 1
    width: number
    height: number
    matrix?: number[]
}) {
    const matrixOffset = version === 1 ? 52 : 40
    const payload = Buffer.alloc(matrixOffset + 44)
    payload[0] = version
    matrix.forEach((value, index) => payload.writeInt32BE(value, matrixOffset + index * 4))
    payload.writeUInt32BE(width * 0x10000, matrixOffset + 36)
    payload.writeUInt32BE(height * 0x10000, matrixOffset + 40)
    return atom("tkhd", payload)
}

function mp4(...tracks: Buffer[]) {
    return atom("moov", Buffer.concat(tracks.map((track) => atom("trak", track))))
}

const fileType = atom("ftyp", Buffer.from("isom0000", "latin1"))
const mediaData = atom("mdat", Buffer.alloc(32))

function jpegWithOrientation(orientation: number, width: number, height: number) {
    const tiff = Buffer.alloc(26)
    tiff.write("II", 0, "latin1")
    tiff.writeUInt16LE(42, 2)
    tiff.writeUInt32LE(8, 4)
    tiff.writeUInt16LE(1, 8)
    tiff.writeUInt16LE(0x0112, 10)
    tiff.writeUInt16LE(3, 12)
    tiff.writeUInt32LE(1, 14)
    tiff.writeUInt16LE(orientation, 18)
    const exif = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff])
    const app1 = Buffer.alloc(4)
    app1.writeUInt16BE(0xffe1, 0)
    app1.writeUInt16BE(exif.length + 2, 2)
    const frame = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0, 0, 0, 0, 0x03])
    frame.writeUInt16BE(height, 5)
    frame.writeUInt16BE(width, 7)
    return Buffer.concat([Buffer.from([0xff, 0xd8]), app1, exif, frame, Buffer.alloc(9)])
}

test("reads dimensions of real seed images", () => {
    expect(readMediaDimensions(fixture("group-13-1.jpg"), "jpg")).toEqual({
        width: 934,
        height: 1400,
    })
    expect(readMediaDimensions(fixture("group-13-3.png"), "png")).toEqual({
        width: 758,
        height: 960,
    })
})

test("reads GIF logical screen size", () => {
    const gif = Buffer.from("GIF89a\x40\x01\xf0\x00\x00\x00\x00", "latin1")
    expect(readMediaDimensions(gif, "gif")).toEqual({ width: 320, height: 240 })
})

test("swaps JPEG dimensions for rotated EXIF orientations only", () => {
    expect(readMediaDimensions(jpegWithOrientation(6, 400, 300), "jpg")).toEqual({
        width: 300,
        height: 400,
    })
    expect(readMediaDimensions(jpegWithOrientation(1, 400, 300), "jpg")).toEqual({
        width: 400,
        height: 300,
    })
})

test("reads MP4 track headers in both versions and with rotation", () => {
    expect(
        readMediaDimensions(
            Buffer.concat([fileType, mp4(trackHeader({ width: 1920, height: 1080 }))]),
            "mp4"
        )
    ).toEqual({ width: 1920, height: 1080 })
    expect(
        readMediaDimensions(
            Buffer.concat([fileType, mp4(trackHeader({ version: 1, width: 640, height: 480 }))]),
            "mp4"
        )
    ).toEqual({ width: 640, height: 480 })
    expect(
        readMediaDimensions(
            mp4(
                trackHeader({
                    width: 1920,
                    height: 1080,
                    matrix: [0, 0x10000, 0, -0x10000, 0, 0, 0, 0, 0x40000000],
                })
            ),
            "mp4"
        )
    ).toEqual({ width: 1080, height: 1920 })
})

test("skips audio tracks and finds moov after mdat", () => {
    expect(
        readMediaDimensions(
            Buffer.concat([
                fileType,
                mediaData,
                mp4(
                    trackHeader({ width: 0, height: 0 }),
                    trackHeader({ width: 720, height: 1280 })
                ),
            ]),
            "mp4"
        )
    ).toEqual({ width: 720, height: 1280 })
})

test("returns null for truncated or foreign content", () => {
    const headersOnly = {
        png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]),
        jpg: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
        gif: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
        mp4: Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]),
    } as const

    for (const [type, content] of Object.entries(headersOnly)) {
        expect(readMediaDimensions(content, type as keyof typeof headersOnly)).toBeNull()
    }
    expect(readMediaDimensions(fixture("group-13-3.png"), "jpg")).toBeNull()
    expect(readMediaDimensions(Buffer.alloc(0), "mp4")).toBeNull()
})
