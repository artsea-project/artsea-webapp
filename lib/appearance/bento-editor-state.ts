import type { BentoBoxLayout, BentoLayoutItem } from "@/types/bento"

export type BentoView = keyof BentoBoxLayout

export type BentoEditorState = { saved: BentoBoxLayout; draft: BentoBoxLayout }

export type BentoEditorAction = { type: "revert" } | { type: "saved" }

function mapViews(
    layout: BentoBoxLayout,
    update: (items: BentoLayoutItem[], view: BentoView) => BentoLayoutItem[]
): BentoBoxLayout {
    return {
        desktop: { items: update(layout.desktop.items, "desktop") },
        mobile: { items: update(layout.mobile.items, "mobile") },
    }
}

export function bentoEditorReducer(
    state: BentoEditorState,
    action: BentoEditorAction
): BentoEditorState {
    switch (action.type) {
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
