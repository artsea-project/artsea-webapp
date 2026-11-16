import { expect, test } from "@playwright/test"

import {
    bentoEditorReducer,
    isBentoDirty,
    type BentoEditorState,
} from "../lib/appearance/bento-editor-state"
import type { BentoBoxLayout, BentoLayoutItem } from "../types/bento"

const artPieceId = "a7f3bc01-0000-4000-8000-000000000101"
const mediaId = "a7f3bc01-0000-4000-8000-000000000201"
const first = "a7f3bc01-0000-4000-8000-000000000501"
const second = "a7f3bc01-0000-4000-8000-000000000502"

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
