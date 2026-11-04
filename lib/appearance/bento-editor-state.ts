import {
    DESKTOP_GRID,
    MOBILE_GRID,
    TILE_PRESETS,
    findFreeSpot,
    fitsGrid,
    hasOverlaps,
    overlaps,
    type GridSpec,
    type TileBox,
    type TilePreset,
} from "@/lib/bento-grid"
import type { BentoBoxLayout, BentoLayoutItem } from "@/types/bento"

export type BentoView = keyof BentoBoxLayout

export const BENTO_VIEW_GRIDS: Record<BentoView, GridSpec> = {
    desktop: DESKTOP_GRID,
    mobile: MOBILE_GRID,
}

const VIEWS: BentoView[] = ["desktop", "mobile"]

export type BentoEditorState = { saved: BentoBoxLayout; draft: BentoBoxLayout }

export type TileContent = { artPieceId: string; mediaId: string }

export type BentoEditorAction =
    | { type: "move"; view: BentoView; tileId: string; box: TileBox }
    | { type: "swap"; view: BentoView; sourceId: string; targetIds: string[] }
    | ({ type: "add"; tileId: string; preset: TilePreset } & TileContent)
    | ({ type: "replaceContent"; tileId: string } & TileContent)
    | { type: "remove"; tileId: string }
    | { type: "revert" }
    | { type: "saved" }

function mapViews(
    layout: BentoBoxLayout,
    update: (items: BentoLayoutItem[], view: BentoView) => BentoLayoutItem[]
): BentoBoxLayout {
    return {
        desktop: { items: update(layout.desktop.items, "desktop") },
        mobile: { items: update(layout.mobile.items, "mobile") },
    }
}

function placeTile(items: BentoLayoutItem[], grid: GridSpec, preset: TilePreset): TileBox | null {
    const size = TILE_PRESETS[preset]
    const spot = findFreeSpot(items, size, grid)
    return spot && { ...spot, ...size }
}

export function canAddTile(draft: BentoBoxLayout, preset: TilePreset): boolean {
    return VIEWS.every((view) => placeTile(draft[view].items, BENTO_VIEW_GRIDS[view], preset))
}

function addTile(
    draft: BentoBoxLayout,
    action: Extract<BentoEditorAction, { type: "add" }>
): BentoBoxLayout {
    if (!canAddTile(draft, action.preset)) return draft

    const { tileId, artPieceId, mediaId, preset } = action
    return mapViews(draft, (items, view) => [
        ...items,
        { tileId, artPieceId, mediaId, ...placeTile(items, BENTO_VIEW_GRIDS[view], preset)! },
    ])
}

function isValidLayout(items: BentoLayoutItem[], grid: GridSpec): boolean {
    return items.every((item) => fitsGrid(item, grid)) && !hasOverlaps(items)
}

/** The tile with its box replaced, or null when it would leave the grid or cover another tile. */
export function moveTile(
    items: BentoLayoutItem[],
    tileId: string,
    box: TileBox,
    grid: GridSpec
): BentoLayoutItem[] | null {
    const moved = items.map((item) => (item.tileId === tileId ? { ...item, ...box } : item))
    return isValidLayout(moved, grid) ? moved : null
}

/** The tiles a dragged tile would cover at the given box: they trade places with it on drop. */
export function findDisplacedTiles(
    items: BentoLayoutItem[],
    sourceId: string,
    box: TileBox
): string[] {
    return items
        .filter((item) => item.tileId !== sourceId && overlaps(item, box))
        .map((item) => item.tileId)
}

function boundingBox(boxes: TileBox[]): TileBox {
    const columnStart = Math.min(...boxes.map((box) => box.columnStart))
    const rowStart = Math.min(...boxes.map((box) => box.rowStart))
    const columnEnd = Math.max(...boxes.map((box) => box.columnStart + box.columnSpan))
    const rowEnd = Math.max(...boxes.map((box) => box.rowStart + box.rowSpan))
    return {
        columnStart,
        rowStart,
        columnSpan: columnEnd - columnStart,
        rowSpan: rowEnd - rowStart,
    }
}

type Offset = { columns: number; rows: number }

/**
 * Where the dragged tile goes and how far the covered group moves. A group lying right next to
 * the tile in the same band (same rows side by side, or same columns one above the other) swaps
 * order with it inside that band. Otherwise the tile takes the group's top left corner and the
 * group moves, as a whole, into the tile's old corner.
 */
function planSwap(source: TileBox, group: TileBox): { source: TileBox; groupOffset: Offset } {
    const sameRows = source.rowStart === group.rowStart && source.rowSpan === group.rowSpan
    const sameColumns =
        source.columnStart === group.columnStart && source.columnSpan === group.columnSpan

    if (sameRows && group.columnStart === source.columnStart + source.columnSpan) {
        return {
            source: { ...source, columnStart: source.columnStart + group.columnSpan },
            groupOffset: { columns: source.columnStart - group.columnStart, rows: 0 },
        }
    }
    if (sameRows && source.columnStart === group.columnStart + group.columnSpan) {
        return {
            source: { ...source, columnStart: group.columnStart },
            groupOffset: { columns: source.columnSpan, rows: 0 },
        }
    }
    if (sameColumns && group.rowStart === source.rowStart + source.rowSpan) {
        return {
            source: { ...source, rowStart: source.rowStart + group.rowSpan },
            groupOffset: { columns: 0, rows: source.rowStart - group.rowStart },
        }
    }
    if (sameColumns && source.rowStart === group.rowStart + group.rowSpan) {
        return {
            source: { ...source, rowStart: group.rowStart },
            groupOffset: { columns: 0, rows: source.rowSpan },
        }
    }

    return {
        source: { ...source, columnStart: group.columnStart, rowStart: group.rowStart },
        groupOffset: {
            columns: source.columnStart - group.columnStart,
            rows: source.rowStart - group.rowStart,
        },
    }
}

/**
 * Trades places between a tile and the tiles it was dropped on, every tile keeping its size.
 * Null when the result would leave the grid or overlap.
 */
export function swapWithTiles(
    items: BentoLayoutItem[],
    sourceId: string,
    targetIds: string[],
    grid: GridSpec
): BentoLayoutItem[] | null {
    const source = items.find((item) => item.tileId === sourceId)
    const group = items.filter((item) => targetIds.includes(item.tileId))
    if (!source || group.length === 0 || group.length !== targetIds.length) return null

    const plan = planSwap(source, boundingBox(group))
    const swapped = items.map((item) => {
        if (item === source) return { ...item, ...plan.source }
        if (!group.includes(item)) return item
        return {
            ...item,
            columnStart: item.columnStart + plan.groupOffset.columns,
            rowStart: item.rowStart + plan.groupOffset.rows,
        }
    })
    return isValidLayout(swapped, grid) ? swapped : null
}

function updateView(
    state: BentoEditorState,
    view: BentoView,
    items: BentoLayoutItem[] | null
): BentoEditorState {
    return items ? { ...state, draft: { ...state.draft, [view]: { items } } } : state
}

export function bentoEditorReducer(
    state: BentoEditorState,
    action: BentoEditorAction
): BentoEditorState {
    switch (action.type) {
        case "move": {
            const grid = BENTO_VIEW_GRIDS[action.view]
            const items = state.draft[action.view].items
            return updateView(state, action.view, moveTile(items, action.tileId, action.box, grid))
        }
        case "swap": {
            const grid = BENTO_VIEW_GRIDS[action.view]
            const items = state.draft[action.view].items
            return updateView(
                state,
                action.view,
                swapWithTiles(items, action.sourceId, action.targetIds, grid)
            )
        }
        case "add":
            return { ...state, draft: addTile(state.draft, action) }
        case "replaceContent":
            return {
                ...state,
                draft: mapViews(state.draft, (items) =>
                    items.map((item) =>
                        item.tileId === action.tileId
                            ? { ...item, artPieceId: action.artPieceId, mediaId: action.mediaId }
                            : item
                    )
                ),
            }
        case "remove":
            return {
                ...state,
                draft: mapViews(state.draft, (items) =>
                    items.filter((item) => item.tileId !== action.tileId)
                ),
            }
        case "revert":
            return { ...state, draft: state.saved }
        case "saved":
            return { ...state, saved: state.draft }
    }
}

function layoutKey(layout: BentoBoxLayout): string {
    return JSON.stringify(
        mapViews(layout, (items) =>
            [...items].sort((left, right) => left.tileId.localeCompare(right.tileId))
        )
    )
}

export function isBentoDirty(state: BentoEditorState): boolean {
    return layoutKey(state.saved) !== layoutKey(state.draft)
}
