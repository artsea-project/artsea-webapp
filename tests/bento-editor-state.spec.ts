import { expect, test } from "@playwright/test"

import {
    bentoEditorReducer,
    canAddTile,
    isBentoDirty,
    type BentoEditorState,
} from "../lib/appearance/bento-editor-state"
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

    const saved = bentoEditorReducer(edited, { type: "saved" })
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
