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
        expect(state.draft[view].items[1]).toEqual({
            ...item(second, 4, 1),
            artPieceId: otherArtPieceId,
            mediaId: otherMediaId,
        })
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

function box(
    tileId: string,
    columnStart: number,
    rowStart: number,
    columnSpan: number,
    rowSpan: number
): BentoLayoutItem {
    return { tileId, artPieceId, mediaId, columnStart, rowStart, columnSpan, rowSpan }
}

// The sample seed's desktop layout: twelve fields, fully used.
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

test("no tiles are displaced when a tile is dropped on free cells", () => {
    const items = [item(first, 1, 1), item(second, 4, 1)]
    expect(
        findDisplacedTiles(items, first, { columnStart: 7, rowStart: 1, columnSpan: 3, rowSpan: 3 })
    ).toEqual([])
})

test("revert restores the saved layout and saved marks the draft as clean", () => {
    const changed = bentoEditorReducer(initial, { type: "remove", tileId: first })
    expect(isBentoDirty(bentoEditorReducer(changed, { type: "revert" }))).toBe(false)
    expect(bentoEditorReducer(changed, { type: "revert" }).draft).toEqual(layout)

    const saved = bentoEditorReducer(changed, { type: "saved" })
    expect(isBentoDirty(saved)).toBe(false)
    expect(saved.saved.desktop.items).toHaveLength(1)
})

test("tile order does not make a layout dirty", () => {
    const reordered: BentoBoxLayout = {
        desktop: { items: [...layout.desktop.items].reverse() },
        mobile: layout.mobile,
    }
    expect(isBentoDirty({ saved: layout, draft: reordered })).toBe(false)
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
