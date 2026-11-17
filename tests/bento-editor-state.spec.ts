import { expect, test } from "@playwright/test"

import {
    bentoEditorReducer,
    canAddTile,
    findDisplacedTiles,
    isBentoDirty,
    swapWithTiles,
    type BentoEditorState,
} from "../lib/appearance/bento-editor-state"
import { DESKTOP_GRID } from "../lib/bento-grid"
import { hasSameTiles } from "../lib/bento-layout"
import type { BentoBoxLayout, BentoLayoutItem } from "../types/bento"

const artPieceId = "a7f3bc01-0000-4000-8000-000000000101"
const otherArtPieceId = "a7f3bc01-0000-4000-8000-000000000102"
const mediaId = "a7f3bc01-0000-4000-8000-000000000201"
const otherMediaId = "a7f3bc01-0000-4000-8000-000000000202"
const first = "a7f3bc01-0000-4000-8000-000000000501"
const second = "a7f3bc01-0000-4000-8000-000000000502"
const added = "a7f3bc01-0000-4000-8000-000000000503"

function item(tileId: string, columnStart: number, rowStart: number, span = 3): BentoLayoutItem {
    return { tileId, artPieceId, mediaId, columnStart, rowStart, columnSpan: span, rowSpan: span }
}

const layout: BentoBoxLayout = {
    desktop: { items: [item(first, 1, 1), item(second, 4, 1)] },
    mobile: { items: [item(first, 1, 1), item(second, 4, 1)] },
}

const initial: BentoEditorState = { saved: layout, draft: layout }

const edited: BentoEditorState = {
    saved: layout,
    draft: { desktop: { items: [item(first, 1, 1)] }, mobile: { items: [item(first, 1, 1)] } },
}

test("a fresh editor has no changes and an edited draft has", () => {
    expect(isBentoDirty(initial)).toBe(false)
    expect(isBentoDirty(edited)).toBe(true)
})

test("revert restores the saved layout and saved marks the draft as clean", () => {
    const reverted = bentoEditorReducer(edited, { type: "revert" })
    expect(reverted.draft).toEqual(layout)
    expect(isBentoDirty(reverted)).toBe(false)

    const saved = bentoEditorReducer(edited, { type: "saved", layout: edited.draft })
    expect(isBentoDirty(saved)).toBe(false)
    expect(saved.saved.desktop.items).toHaveLength(1)
})

test("a change made while saving stays unsaved", () => {
    const sent = edited.draft
    const changedMeanwhile = bentoEditorReducer(edited, { type: "remove", tileId: first })
    const saved = bentoEditorReducer(changedMeanwhile, { type: "saved", layout: sent })

    expect(saved.saved).toBe(sent)
    expect(isBentoDirty(saved)).toBe(true)
})

test("tile order does not make a layout dirty", () => {
    const reordered: BentoBoxLayout = {
        desktop: { items: [...layout.desktop.items].reverse() },
        mobile: layout.mobile,
    }
    expect(isBentoDirty({ saved: layout, draft: reordered })).toBe(false)
})

test("adding a tile puts it below the others in both views", () => {
    const state = bentoEditorReducer(initial, {
        type: "add",
        tileId: added,
        artPieceId: otherArtPieceId,
        mediaId: otherMediaId,
        preset: "2:1",
    })

    const desktopTile = state.draft.desktop.items.find((tile) => tile.tileId === added)
    const mobileTile = state.draft.mobile.items.find((tile) => tile.tileId === added)
    expect(desktopTile).toMatchObject({ columnStart: 1, rowStart: 4, columnSpan: 6, rowSpan: 3 })
    expect(mobileTile).toMatchObject({ columnStart: 1, rowStart: 4, columnSpan: 6, rowSpan: 3 })
    expect(hasSameTiles(state.draft.desktop.items, state.draft.mobile.items)).toBe(true)
    expect(isBentoDirty(state)).toBe(true)
})

test("a full desktop grid blocks adding and leaves the draft unchanged", () => {
    const tiles = Array.from({ length: 12 }, (_, index) =>
        item(
            `a7f3bc01-0000-4000-8000-0000000006${String(index).padStart(2, "0")}`,
            (index % 4) * 3 + 1,
            Math.floor(index / 4) * 3 + 1
        )
    )
    const full: BentoBoxLayout = {
        desktop: { items: tiles },
        mobile: {
            items: tiles.map((tile, index) => ({
                ...tile,
                columnStart: (index % 2) * 3 + 1,
                rowStart: Math.floor(index / 2) * 3 + 1,
            })),
        },
    }
    const state: BentoEditorState = { saved: full, draft: full }

    expect(canAddTile(full, "1:1")).toBe(false)
    expect(
        bentoEditorReducer(state, {
            type: "add",
            tileId: added,
            artPieceId,
            mediaId,
            preset: "1:1",
        }).draft
    ).toBe(full)
})

test("removing a tile removes it from both views", () => {
    const state = bentoEditorReducer(initial, { type: "remove", tileId: first })

    expect(state.draft.desktop.items.map((tile) => tile.tileId)).toEqual([second])
    expect(state.draft.mobile.items.map((tile) => tile.tileId)).toEqual([second])
})

test("replacing the content keeps positions and sizes in both views", () => {
    const state = bentoEditorReducer(initial, {
        type: "replaceContent",
        tileId: second,
        artPieceId: otherArtPieceId,
        mediaId: otherMediaId,
    })

    for (const view of ["desktop", "mobile"] as const) {
        expect(state.draft[view].items).toEqual([
            item(first, 1, 1),
            { ...item(second, 4, 1), artPieceId: otherArtPieceId, mediaId: otherMediaId },
        ])
    }
})

test("moving tiles changes only the given view", () => {
    const state = bentoEditorReducer(initial, {
        type: "move",
        view: "desktop",
        tileId: first,
        box: { columnStart: 1, rowStart: 4, columnSpan: 6, rowSpan: 6 },
    })

    expect(state.draft.desktop.items[0]).toMatchObject({ rowStart: 4, columnSpan: 6, rowSpan: 6 })
    expect(state.draft.mobile.items[0]).toEqual(item(first, 1, 1))
    expect(isBentoDirty(state)).toBe(true)
})

test("a move onto another tile or out of the grid is ignored", () => {
    const onto = bentoEditorReducer(initial, {
        type: "move",
        view: "desktop",
        tileId: first,
        box: { columnStart: 4, rowStart: 1, columnSpan: 3, rowSpan: 3 },
    })
    const outside = bentoEditorReducer(initial, {
        type: "move",
        view: "desktop",
        tileId: first,
        box: { columnStart: 1, rowStart: 7, columnSpan: 3, rowSpan: 6 },
    })

    expect(onto).toBe(initial)
    expect(outside).toBe(initial)
})

test("no tiles are displaced when a tile is dropped on free cells", () => {
    const items = [item(first, 1, 1), item(second, 4, 1)]
    expect(
        findDisplacedTiles(items, first, { columnStart: 7, rowStart: 1, columnSpan: 3, rowSpan: 3 })
    ).toEqual([])
})

test("a dragged tile displaces every tile under it except itself", () => {
    const items = [item(first, 1, 1), item(second, 4, 1), item(added, 1, 4)]
    expect(
        findDisplacedTiles(items, first, { columnStart: 1, rowStart: 1, columnSpan: 6, rowSpan: 3 })
    ).toEqual([second])
    expect(
        findDisplacedTiles(items, first, { columnStart: 1, rowStart: 1, columnSpan: 6, rowSpan: 6 })
    ).toEqual([second, added])
})

function box(
    tileId: string,
    columnStart: number,
    rowStart: number,
    columnSpan: number,
    rowSpan: number
): BentoLayoutItem {
    return { tileId, artPieceId, mediaId, columnStart, rowStart, columnSpan, rowSpan }
}

const seedDesktop = [
    box("a", 1, 1, 3, 6),
    box("b", 4, 1, 3, 3),
    box("c", 4, 4, 3, 3),
    box("d", 7, 1, 6, 6),
    box("e", 1, 7, 6, 3),
    box("f", 7, 7, 3, 3),
    box("g", 10, 7, 3, 3),
]

function positions(items: BentoLayoutItem[]) {
    return Object.fromEntries(items.map((item) => [item.tileId, [item.columnStart, item.rowStart]]))
}

test("a tall tile dropped on two stacked tiles swaps places with both", () => {
    const covered = findDisplacedTiles(seedDesktop, "a", {
        columnStart: 4,
        rowStart: 1,
        columnSpan: 3,
        rowSpan: 6,
    })
    expect(covered).toEqual(["b", "c"])

    const swapped = swapWithTiles(seedDesktop, "a", covered, DESKTOP_GRID)!
    expect(positions(swapped)).toMatchObject({ a: [4, 1], b: [1, 1], c: [1, 4], d: [7, 1] })
    expect(swapped.find((item) => item.tileId === "a")).toMatchObject({
        columnSpan: 3,
        rowSpan: 6,
    })
})

test("one of two stacked tiles alone cannot trade places with a taller tile", () => {
    expect(swapWithTiles(seedDesktop, "b", ["a"], DESKTOP_GRID)).toBeNull()
})

test("side by side tiles of different widths swap order in their row", () => {
    const swapped = swapWithTiles(seedDesktop, "e", ["f"], DESKTOP_GRID)!
    expect(positions(swapped)).toMatchObject({ f: [1, 7], e: [4, 7], g: [10, 7] })
})

test("equal tiles that are not neighbours swap corners", () => {
    const swapped = swapWithTiles(seedDesktop, "f", ["b"], DESKTOP_GRID)!
    expect(positions(swapped)).toMatchObject({ f: [4, 1], b: [7, 7], c: [4, 4] })
})

test("a swap that does not fit leaves the layout unchanged", () => {
    const state: BentoEditorState = {
        saved: layout,
        draft: { ...layout, desktop: { items: seedDesktop } },
    }

    expect(swapWithTiles(seedDesktop, "a", ["g"], DESKTOP_GRID)).toBeNull()
    expect(
        bentoEditorReducer(state, {
            type: "swap",
            view: "desktop",
            sourceId: "a",
            targetIds: ["g"],
        })
    ).toBe(state)
})

test("the swap action updates only the given view", () => {
    const state = bentoEditorReducer(
        { saved: layout, draft: { ...layout, desktop: { items: seedDesktop } } },
        { type: "swap", view: "desktop", sourceId: "e", targetIds: ["f"] }
    )

    expect(positions(state.draft.desktop.items)).toMatchObject({ f: [1, 7], e: [4, 7] })
    expect(state.draft.mobile).toBe(layout.mobile)
})

test("stacked tiles of different heights swap order in their column", () => {
    const stacked = [box("x", 1, 1, 6, 3), box("y", 1, 4, 6, 6)]
    const expected = { x: [1, 7], y: [1, 1] }

    expect(positions(swapWithTiles(stacked, "x", ["y"], DESKTOP_GRID)!)).toEqual(expected)
    expect(positions(swapWithTiles(stacked, "y", ["x"], DESKTOP_GRID)!)).toEqual(expected)
})
