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

export function describePreset(box: TileBox): TilePreset | null {
    return (
        (Object.keys(TILE_PRESETS) as TilePreset[]).find(
            (name) =>
                TILE_PRESETS[name].columnSpan === box.columnSpan &&
                TILE_PRESETS[name].rowSpan === box.rowSpan
        ) ?? null
    )
}
