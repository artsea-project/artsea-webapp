import { fitsGrid, overlaps, type GridSpec } from "@/lib/bento-grid"
import type { BentoLayoutItem } from "@/types/bento"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_PATTERN.test(value)
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

/**
 * Keeps the entries that fit the grid, in order. An entry is dropped when its tile id repeats or
 * when it overlaps an entry kept before it.
 */
export function normalizeBentoLayout(layout: unknown, grid: GridSpec): BentoLayoutItem[] {
    if (
        !layout ||
        typeof layout !== "object" ||
        !Array.isArray((layout as { items?: unknown }).items)
    ) {
        return []
    }

    const kept: BentoLayoutItem[] = []
    for (const candidate of (layout as { items: unknown[] }).items) {
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

/** Desktop and mobile must hold the same tiles, each showing the same work and image. */
export function hasSameTiles(desktop: BentoLayoutItem[], mobile: BentoLayoutItem[]): boolean {
    if (desktop.length !== mobile.length) return false

    const mobileKeys = new Set(mobile.map(contentKey))
    return desktop.every((item) => mobileKeys.has(contentKey(item)))
}
