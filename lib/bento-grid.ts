import type { BentoLayoutItem } from "@/types/bento"

export type GridSpec = { columns: number; rows: number }

export const FIELD_SIZE = 3

export const DESKTOP_GRID: GridSpec = { columns: 12, rows: 9 }

export const MOBILE_GRID: GridSpec = { columns: 6, rows: 90 }

export type TilePreset = "1:1" | "2:1" | "1:2" | "2:2"

export type TileSize = { columnSpan: number; rowSpan: number }

export const TILE_PRESETS: Record<TilePreset, TileSize> = {
    "1:1": { columnSpan: FIELD_SIZE, rowSpan: FIELD_SIZE },
    "2:1": { columnSpan: 2 * FIELD_SIZE, rowSpan: FIELD_SIZE },
    "1:2": { columnSpan: FIELD_SIZE, rowSpan: 2 * FIELD_SIZE },
    "2:2": { columnSpan: 2 * FIELD_SIZE, rowSpan: 2 * FIELD_SIZE },
}

export type TilePosition = { columnStart: number; rowStart: number }

export type TileBox = Pick<BentoLayoutItem, "columnStart" | "rowStart" | "columnSpan" | "rowSpan">

function isFieldSpan(span: number): boolean {
    return span === FIELD_SIZE || span === 2 * FIELD_SIZE
}

function isFieldStart(start: number): boolean {
    return start >= 1 && (start - 1) % FIELD_SIZE === 0
}

export function fitsGrid(box: TileBox, grid: GridSpec): boolean {
    return (
        isFieldStart(box.columnStart) &&
        isFieldStart(box.rowStart) &&
        isFieldSpan(box.columnSpan) &&
        isFieldSpan(box.rowSpan) &&
        box.columnStart + box.columnSpan - 1 <= grid.columns &&
        box.rowStart + box.rowSpan - 1 <= grid.rows
    )
}

export function overlaps(a: TileBox, b: TileBox): boolean {
    return (
        a.columnStart < b.columnStart + b.columnSpan &&
        b.columnStart < a.columnStart + a.columnSpan &&
        a.rowStart < b.rowStart + b.rowSpan &&
        b.rowStart < a.rowStart + a.rowSpan
    )
}

export function hasOverlaps(boxes: TileBox[]): boolean {
    return boxes.some((box, index) => boxes.slice(index + 1).some((other) => overlaps(box, other)))
}

function isFree(box: TileBox, boxes: TileBox[], grid: GridSpec): boolean {
    return fitsGrid(box, grid) && !boxes.some((other) => overlaps(box, other))
}

function fieldStarts(lineCount: number, span: number): number[] {
    const starts: number[] = []
    for (let start = 1; start + span - 1 <= lineCount; start += FIELD_SIZE) starts.push(start)
    return starts
}

export function findFreeSpot(
    boxes: TileBox[],
    size: TileSize,
    grid: GridSpec
): TilePosition | null {
    const bottom = Math.max(0, ...boxes.map((box) => box.rowStart + box.rowSpan - 1))
    const belowLowestTile = { columnStart: 1, rowStart: bottom + 1 }
    const fieldsFromBottomUp = fieldStarts(grid.rows, size.rowSpan)
        .reverse()
        .flatMap((rowStart) =>
            fieldStarts(grid.columns, size.columnSpan).map((columnStart) => ({
                columnStart,
                rowStart,
            }))
        )

    return (
        [belowLowestTile, ...fieldsFromBottomUp].find((spot) =>
            isFree({ ...spot, ...size }, boxes, grid)
        ) ?? null
    )
}

export function describePreset(box: TileBox): TilePreset | null {
    return (
        (Object.keys(TILE_PRESETS) as TilePreset[]).find(
            (name) =>
                TILE_PRESETS[name].columnSpan === box.columnSpan &&
                TILE_PRESETS[name].rowSpan === box.rowSpan
        ) ?? null
    )
}
