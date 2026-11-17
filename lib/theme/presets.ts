import type { SiteTheme, SiteThemeColors, SiteThemeFonts } from "@/types/theme"
import { defaultThemeColors, isSameColor } from "./colors"
import { defaultThemeFonts } from "./fonts"

export type ThemePresetId = SiteTheme["presetTheme"]

export interface ThemePreset {
    label: string
    fonts: SiteThemeFonts
    colors: SiteThemeColors
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
    default: {
        label: "Domyślny",
        fonts: defaultThemeFonts,
        colors: defaultThemeColors,
    },
    dark: {
        label: "Ciemny",
        fonts: defaultThemeFonts,
        colors: {
            foregroundColor: "#F5F5F4",
            backgroundColor: "#1C1917",
            accentColor: "#D6D3D1",
        },
    },
    default_green: {
        label: "Jasny-zielony",
        fonts: defaultThemeFonts,
        colors: {
            foregroundColor: "#1C1917",
            backgroundColor: "#F6F8F4",
            accentColor: "#2F7D4F",
        },
    },
}

type ThemeValues = { fonts: SiteThemeFonts; colors: SiteThemeColors }

function matchesPreset(preset: ThemePreset, theme: ThemeValues): boolean {
    const fontFields = Object.keys(preset.fonts) as (keyof SiteThemeFonts)[]
    const colorFields = Object.keys(preset.colors) as (keyof SiteThemeColors)[]
    return (
        fontFields.every((field) => preset.fonts[field] === theme.fonts[field]) &&
        colorFields.every((field) => isSameColor(preset.colors[field], theme.colors[field]))
    )
}

export function findMatchingPreset(theme: ThemeValues): ThemePresetId | null {
    const ids = Object.keys(THEME_PRESETS) as ThemePresetId[]
    return ids.find((id) => matchesPreset(THEME_PRESETS[id], theme)) ?? null
}
