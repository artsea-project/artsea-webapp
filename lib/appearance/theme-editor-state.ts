import { THEME_PRESETS, type ThemePresetId } from "@/lib/theme/presets"
import type { SiteThemeColors, SiteThemeFonts } from "@/types/theme"

export type ThemeDraft = { fonts: SiteThemeFonts; colors: SiteThemeColors }

export type ThemeEditorState = { saved: ThemeDraft; draft: ThemeDraft }

export type ThemeEditorAction =
    | { type: "setFont"; field: keyof SiteThemeFonts; value: string }
    | { type: "setColor"; field: keyof SiteThemeColors; value: string }
    | { type: "applyPreset"; preset: ThemePresetId }
    | { type: "revert" }
    | { type: "saved" }

export function themeEditorReducer(
    state: ThemeEditorState,
    action: ThemeEditorAction
): ThemeEditorState {
    switch (action.type) {
        case "setFont":
            return {
                ...state,
                draft: {
                    ...state.draft,
                    fonts: { ...state.draft.fonts, [action.field]: action.value },
                },
            }
        case "setColor":
            return {
                ...state,
                draft: {
                    ...state.draft,
                    colors: { ...state.draft.colors, [action.field]: action.value },
                },
            }
        case "applyPreset": {
            const { fonts, colors } = THEME_PRESETS[action.preset]
            return { ...state, draft: { fonts: { ...fonts }, colors: { ...colors } } }
        }
        case "revert":
            return { ...state, draft: state.saved }
        case "saved":
            return { ...state, saved: state.draft }
    }
}

export function isThemeDirty(state: ThemeEditorState): boolean {
    return JSON.stringify(state.saved) !== JSON.stringify(state.draft)
}
