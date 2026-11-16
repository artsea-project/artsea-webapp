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

type AddTileAction = { type: "add"; tileId: string; preset: TilePreset } & TileContent

export type BentoEditorAction =
    | { type: "move"; view: BentoView; tileId: string; box: TileBox }
    | { type: "swap"; view: BentoView; sourceId: string; targetIds: string[] }
    | AddTileAction
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

function addTile(draft: BentoBoxLayout, action: AddTileAction): BentoBoxLayout {
    if (!canAddTile(draft, action.preset)) return draft

    const { tileId, artPieceId, mediaId, preset } = action
    return mapViews(draft, (items, view) => {
        const box = placeTile(items, BENTO_VIEW_GRIDS[view], preset)
        return box ? [...items, { tileId, artPieceId, mediaId, ...box }] : items
    })
}

function isValidLayout(items: BentoLayoutItem[], grid: GridSpec): boolean {
    return items.every((item) => fitsGrid(item, grid)) && !hasOverlaps(items)
}

export function moveTile(
    items: BentoLayoutItem[],
    tileId: string,
    box: TileBox,
    grid: GridSpec
): BentoLayoutItem[] | null {
    const moved = items.map((item) => (item.tileId === tileId ? { ...item, ...box } : item))
    return isValidLayout(moved, grid) ? moved : null
}

export function findDisplacedTiles(
    items: BentoLayoutItem[],
    sourceId: string,
    box: TileBox
): string[] {
    return items
        .filter((item) => item.tileId !== sourceId && overlaps(item, box))
        .map((item) => item.tileId)
}

type Offset = { columns: number; rows: number }

type SwapPlan = { source: TileBox; groupOffset: Offset }

type Axis = {
    start: "columnStart" | "rowStart"
    span: "columnSpan" | "rowSpan"
    offset: keyof Offset
}

const COLUMNS: Axis = { start: "columnStart", span: "columnSpan", offset: "columns" }
const ROWS: Axis = { start: "rowStart", span: "rowSpan", offset: "rows" }

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

function swapWithinBand(
    source: TileBox,
    group: TileBox,
    along: Axis,
    across: Axis
): SwapPlan | null {
    const sameBand =
        source[across.start] === group[across.start] && source[across.span] === group[across.span]
    if (!sameBand) return null

    const noOffset = { columns: 0, rows: 0 }
    if (group[along.start] === source[along.start] + source[along.span]) {
        return {
            source: { ...source, [along.start]: source[along.start] + group[along.span] },
            groupOffset: { ...noOffset, [along.offset]: source[along.start] - group[along.start] },
        }
    }
    if (source[along.start] === group[along.start] + group[along.span]) {
        return {
            source: { ...source, [along.start]: group[along.start] },
            groupOffset: { ...noOffset, [along.offset]: source[along.span] },
        }
    }
    return null
}

function swapCorners(source: TileBox, group: TileBox): SwapPlan {
    return {
        source: { ...source, columnStart: group.columnStart, rowStart: group.rowStart },
        groupOffset: {
            columns: source.columnStart - group.columnStart,
            rows: source.rowStart - group.rowStart,
        },
    }
}

function planSwap(source: TileBox, group: TileBox): SwapPlan {
    return (
        swapWithinBand(source, group, COLUMNS, ROWS) ??
        swapWithinBand(source, group, ROWS, COLUMNS) ??
        swapCorners(source, group)
    )
}

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
            const { view, tileId, box } = action
            const items = state.draft[view].items
            return updateView(state, view, moveTile(items, tileId, box, BENTO_VIEW_GRIDS[view]))
        }
        case "swap": {
            const { view, sourceId, targetIds } = action
            const items = state.draft[view].items
            const grid = BENTO_VIEW_GRIDS[view]
            return updateView(state, view, swapWithTiles(items, sourceId, targetIds, grid))
        }
        case "add":
            return { ...state, draft: addTile(state.draft, action) }
        case "replaceContent": {
            const { tileId, artPieceId, mediaId } = action
            return {
                ...state,
                draft: mapViews(state.draft, (items) =>
                    items.map((item) =>
                        item.tileId === tileId ? { ...item, artPieceId, mediaId } : item
                    )
                ),
            }
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
