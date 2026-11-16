import type { BentoLayoutItem } from "@/types/bento"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_PATTERN.test(value)
}

function isLayoutItem(value: unknown, columnCount: number): value is BentoLayoutItem {
    if (!value || typeof value !== "object") return false

    const item = value as Record<string, unknown>
    const numericFields = ["columnStart", "rowStart", "columnSpan", "rowSpan"] as const

    return (
        isUuid(item.tileId) &&
        isUuid(item.artPieceId) &&
        isUuid(item.mediaId) &&
        numericFields.every((field) => Number.isInteger(item[field]) && Number(item[field]) > 0) &&
        Number(item.columnStart) + Number(item.columnSpan) - 1 <= columnCount &&
        Number(item.rowStart) + Number(item.rowSpan) - 1 <= 32
    )
}

export function normalizeBentoLayout(layout: unknown, columnCount: number): BentoLayoutItem[] {
    if (
        !layout ||
        typeof layout !== "object" ||
        !Array.isArray((layout as { items?: unknown }).items)
    ) {
        return []
    }

    return (layout as { items: unknown[] }).items.filter((item): item is BentoLayoutItem =>
        isLayoutItem(item, columnCount)
    )
}

function contentKey(item: BentoLayoutItem): string {
    return `${item.tileId}:${item.artPieceId}:${item.mediaId}`
}

export function hasSameTiles(desktop: BentoLayoutItem[], mobile: BentoLayoutItem[]): boolean {
    if (desktop.length !== mobile.length) return false

    const mobileKeys = new Set(mobile.map(contentKey))
    return desktop.every((item) => mobileKeys.has(contentKey(item)))
}
