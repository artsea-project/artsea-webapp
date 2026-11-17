import { expect, test } from "@playwright/test"

import {
    isThemeDirty,
    themeEditorReducer,
    type ThemeEditorState,
} from "../lib/appearance/theme-editor-state"
import { THEME_PRESETS } from "../lib/theme/presets"

const saved = { fonts: THEME_PRESETS.default.fonts, colors: THEME_PRESETS.default.colors }
const initial: ThemeEditorState = { saved, draft: saved }

test("changing a font or a color edits only the draft", () => {
    const withFont = themeEditorReducer(initial, {
        type: "setFont",
        field: "primaryFont",
        value: "Lora",
    })
    const withColor = themeEditorReducer(withFont, {
        type: "setColor",
        field: "accentColor",
        value: "#2F7D4F",
    })

    expect(withColor.draft.fonts).toEqual({ ...saved.fonts, primaryFont: "Lora" })
    expect(withColor.draft.colors).toEqual({ ...saved.colors, accentColor: "#2F7D4F" })
    expect(withColor.saved).toBe(saved)
    expect(isThemeDirty(withColor)).toBe(true)
})

test("a preset replaces the draft fonts and colors", () => {
    const state = themeEditorReducer(initial, { type: "applyPreset", preset: "dark" })

    expect(state.draft).toEqual({
        fonts: THEME_PRESETS.dark.fonts,
        colors: THEME_PRESETS.dark.colors,
    })
    expect(isThemeDirty(state)).toBe(true)
})

test("revert restores the saved theme and saved marks the draft as clean", () => {
    const edited = themeEditorReducer(initial, { type: "applyPreset", preset: "dark" })

    expect(themeEditorReducer(edited, { type: "revert" }).draft).toEqual(saved)
    expect(isThemeDirty(themeEditorReducer(edited, { type: "saved", theme: edited.draft }))).toBe(
        false
    )
})

test("a change made while saving stays unsaved", () => {
    const edited = themeEditorReducer(initial, { type: "applyPreset", preset: "dark" })
    const sent = edited.draft
    const changedMeanwhile = themeEditorReducer(edited, {
        type: "setFont",
        field: "primaryFont",
        value: "Lora",
    })
    const saved = themeEditorReducer(changedMeanwhile, { type: "saved", theme: sent })

    expect(saved.saved).toBe(sent)
    expect(isThemeDirty(saved)).toBe(true)
})

test("the same color written in other letter case is not a change", () => {
    const state = themeEditorReducer(initial, {
        type: "setColor",
        field: "foregroundColor",
        value: saved.colors.foregroundColor.toLowerCase(),
    })

    expect(isThemeDirty(state)).toBe(false)
})

test("picking the saved values again is not a change", () => {
    const state = themeEditorReducer(initial, { type: "applyPreset", preset: "default" })

    expect(isThemeDirty(state)).toBe(false)
})
