import { fitsGrid, overlaps, type GridSpec } from "@/lib/bento-grid"
import type { BentoLayoutItem } from "@/types/bento"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_PATTERN.test(value)
}

export function createTileId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join("-")
}

function isLayoutItem(value: unknown, grid: GridSpec): value is BentoLayoutItem {
    if (!value || typeof value !== "object") return false

    const item = value as Record<string, unknown>
    const numericFields = ["columnStart", "rowStart", "columnSpan", "rowSpan"] as const

    return (
        isUuid(item.tileId) &&
        isUuid(item.artPieceId) &&
        isUuid(item.mediaId) &&
        numericFields.every((field) => Number.isInteger(item[field])) &&
        fitsGrid(item as unknown as BentoLayoutItem, grid)
    )
}

function pickLayoutItem(item: BentoLayoutItem): BentoLayoutItem {
    const { tileId, artPieceId, mediaId, columnStart, rowStart, columnSpan, rowSpan } = item
    return { tileId, artPieceId, mediaId, columnStart, rowStart, columnSpan, rowSpan }
}

function readItems(layout: unknown): unknown[] {
    const items = layout && typeof layout === "object" && (layout as { items?: unknown }).items
    return Array.isArray(items) ? items : []
}

export function normalizeBentoLayout(layout: unknown, grid: GridSpec): BentoLayoutItem[] {
    const kept: BentoLayoutItem[] = []
    for (const candidate of readItems(layout)) {
        if (!isLayoutItem(candidate, grid)) continue
        if (kept.some((item) => item.tileId === candidate.tileId || overlaps(item, candidate))) {
            continue
        }
        kept.push(pickLayoutItem(candidate))
    }

    return kept
}

function contentKey(item: BentoLayoutItem): string {
    return `${item.tileId}:${item.artPieceId}:${item.mediaId}`
}

export function hasSameTiles(desktop: BentoLayoutItem[], mobile: BentoLayoutItem[]): boolean {
    if (desktop.length !== mobile.length) return false

    const mobileKeys = new Set(mobile.map(contentKey))
    return desktop.every((item) => mobileKeys.has(contentKey(item)))
}
