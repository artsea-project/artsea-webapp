import type { MediaType } from "@/lib/media"

export type MediaDimensions = { width: number; height: number }

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const EXIF_ORIENTATION_TAG = 0x0112
const JPEG_EXIF_SEGMENT = 0xe1
const MP4_CONTAINER_ATOMS = new Set(["moov", "trak"])

function keepIfSizeMakesSense(width: number, height: number): MediaDimensions | null {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return null
    }
    return { width, height }
}

function readPngDimensions(content: Buffer) {
    if (content.length < 24 || !content.subarray(0, 8).equals(PNG_SIGNATURE)) return null
    if (!content.toString("latin1", 12, 16).startsWith("IHDR")) return null
    return keepIfSizeMakesSense(content.readUInt32BE(16), content.readUInt32BE(20))
}

function readExifOrientation(segment: Buffer) {
    if (segment.length < 14 || segment.toString("latin1", 0, 6) !== "Exif\0\0") return null
    const tiff = segment.subarray(6)
    const byteOrder = tiff.toString("latin1", 0, 2)
    if (byteOrder !== "II" && byteOrder !== "MM") return null
    const littleEndian = byteOrder === "II"
    const readUInt16 = (offset: number) =>
        littleEndian ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset)
    const readUInt32 = (offset: number) =>
        littleEndian ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset)

    const directoryOffset = readUInt32(4)
    if (directoryOffset + 2 > tiff.length) return null
    const entryCount = readUInt16(directoryOffset)
    for (let index = 0; index < entryCount; index++) {
        const entryOffset = directoryOffset + 2 + index * 12
        if (entryOffset + 12 > tiff.length) return null
        if (readUInt16(entryOffset) === EXIF_ORIENTATION_TAG) return readUInt16(entryOffset + 8)
    }
    return null
}

function isJpegSizeSegment(marker: number) {
    return marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
}

function isStandaloneJpegMarker(marker: number) {
    return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)
}

function isRotatedSideways(orientation: number | null) {
    return orientation !== null && orientation >= 5 && orientation <= 8
}

function readJpgDimensions(content: Buffer) {
    if (content.length < 4 || content[0] !== 0xff || content[1] !== 0xd8) return null

    let orientation: number | null = null
    let offset = 2
    while (offset + 4 <= content.length) {
        if (content[offset] !== 0xff) return null
        const marker = content[offset + 1]

        if (marker === 0xff) {
            offset++
            continue
        }

        if (isStandaloneJpegMarker(marker)) {
            offset += 2
            continue
        }

        const segmentLength = content.readUInt16BE(offset + 2)
        const segmentEnd = offset + 2 + segmentLength
        if (segmentLength < 2 || segmentEnd > content.length) return null

        if (marker === JPEG_EXIF_SEGMENT && orientation === null) {
            orientation = readExifOrientation(content.subarray(offset + 4, segmentEnd))
        }
        if (isJpegSizeSegment(marker)) {
            if (segmentLength < 7) return null
            const height = content.readUInt16BE(offset + 5)
            const width = content.readUInt16BE(offset + 7)
            return isRotatedSideways(orientation)
                ? keepIfSizeMakesSense(height, width)
                : keepIfSizeMakesSense(width, height)
        }
        offset = segmentEnd
    }
    return null
}

function readTrackHeaderDimensions(atom: Buffer) {
    const version = atom[0]
    const matrixOffset = version === 1 ? 52 : 40
    const sizeOffset = matrixOffset + 36
    if (atom.length < sizeOffset + 8) return null

    const a = atom.readInt32BE(matrixOffset)
    const b = atom.readInt32BE(matrixOffset + 4)
    const width = atom.readUInt32BE(sizeOffset) / 0x10000
    const height = atom.readUInt32BE(sizeOffset + 4) / 0x10000
    const fixedOne = 0x10000
    const rotatedQuarterTurn = a === 0 && Math.abs(b) === fixedOne

    return rotatedQuarterTurn
        ? keepIfSizeMakesSense(height, width)
        : keepIfSizeMakesSense(width, height)
}

function readMp4Dimensions(
    content: Buffer,
    start = 0,
    end = content.length
): MediaDimensions | null {
    let offset = start
    while (offset + 8 <= end) {
        let atomSize = content.readUInt32BE(offset)
        const atomType = content.toString("latin1", offset + 4, offset + 8)
        let headerSize = 8

        if (atomSize === 1) {
            if (offset + 16 > end) return null
            const largeSize = content.readBigUInt64BE(offset + 8)
            if (largeSize > BigInt(end - offset)) return null
            atomSize = Number(largeSize)
            headerSize = 16
        } else if (atomSize === 0) {
            atomSize = end - offset
        }
        if (atomSize < headerSize || offset + atomSize > end) return null

        const payloadStart = offset + headerSize
        const atomEnd = offset + atomSize
        if (atomType === "tkhd") {
            const dimensions = readTrackHeaderDimensions(content.subarray(payloadStart, atomEnd))
            if (dimensions) return dimensions
        } else if (MP4_CONTAINER_ATOMS.has(atomType)) {
            const dimensions = readMp4Dimensions(content, payloadStart, atomEnd)
            if (dimensions) return dimensions
        }
        offset = atomEnd
    }
    return null
}

type DimensionReader = (content: Buffer) => MediaDimensions | null

const DIMENSION_READERS_BY_FILE_TYPE: Record<MediaType, DimensionReader> = {
    png: readPngDimensions,
    jpg: readJpgDimensions,
    gif: readGifDimensions,
    mp4: readMp4Dimensions,
}

function readGifDimensions(content: Buffer) {
    if (content.length < 10) return null
    const signature = content.toString("latin1", 0, 6)
    if (signature !== "GIF87a" && signature !== "GIF89a") return null
    return keepIfSizeMakesSense(content.readUInt16LE(6), content.readUInt16LE(8))
}

export function readMediaDimensions(content: Buffer, fileType: MediaType): MediaDimensions | null {
    try {
        return DIMENSION_READERS_BY_FILE_TYPE[fileType](content)
    } catch {
        return null
    }
}
