import type { BentoLayoutItem } from "@/types/bento"

export type GridSpec = { columns: number; rows: number }

/**
 * Cells per side of a 1:1 field. Every tile is one or two fields wide and tall and starts on a
 * field boundary, so the only sizes are 1:1, 2:1, 1:2 and 2:2.
 */
export const FIELD_SIZE = 3

/** 12 x 9 square cells, which is 4 x 3 fields: twelve 1:1 tiles. */
export const DESKTOP_GRID: GridSpec = { columns: 12, rows: 9 }

/** Two fields wide; tall enough to stack everything the desktop grid can hold. */
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

/** A preset-sized tile on field boundaries, inside the grid. */
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

/** CSS grid placement of a tile, shared by the public bento and its admin previews. */
export function gridPlacement(box: TileBox) {
    return {
        gridColumn: `${box.columnStart} / span ${box.columnSpan}`,
        gridRow: `${box.rowStart} / span ${box.rowSpan}`,
    }
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

/**
 * Where a new tile lands: right below the lowest tile if there is room, otherwise the first free
 * field scanning from the bottom up and left to right. Nothing else moves.
 */
export function findFreeSpot(
    boxes: TileBox[],
    size: TileSize,
    grid: GridSpec
): TilePosition | null {
    const bottom = Math.max(0, ...boxes.map((box) => box.rowStart + box.rowSpan - 1))
    const below = { columnStart: 1, rowStart: bottom + 1, ...size }
    if (isFree(below, boxes, grid)) return { columnStart: 1, rowStart: bottom + 1 }

    const lastRowStart = grid.rows - size.rowSpan + 1
    for (
        let rowStart = lastRowStart - ((lastRowStart - 1) % FIELD_SIZE);
        rowStart >= 1;
        rowStart -= FIELD_SIZE
    ) {
        for (
            let columnStart = 1;
            columnStart + size.columnSpan - 1 <= grid.columns;
            columnStart += FIELD_SIZE
        ) {
            if (isFree({ columnStart, rowStart, ...size }, boxes, grid)) {
                return { columnStart, rowStart }
            }
        }
    }

    return null
}

/** The preset a tile's size matches; tiles that passed validation always match one. */
export function describePreset(box: TileBox): TilePreset | null {
    return (
        (Object.keys(TILE_PRESETS) as TilePreset[]).find(
            (name) =>
                TILE_PRESETS[name].columnSpan === box.columnSpan &&
                TILE_PRESETS[name].rowSpan === box.rowSpan
        ) ?? null
    )
}
