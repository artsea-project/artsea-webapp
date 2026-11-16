import {
    DESKTOP_GRID,
    MOBILE_GRID,
    TILE_PRESETS,
    findFreeSpot,
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

export function bentoEditorReducer(
    state: BentoEditorState,
    action: BentoEditorAction
): BentoEditorState {
    switch (action.type) {
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
