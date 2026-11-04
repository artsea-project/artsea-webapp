import type { SiteTheme, SiteThemeColors, SiteThemeFonts } from "@/types/theme"
import { defaultThemeColors } from "./colors"
import { defaultThemeFonts } from "./fonts"

export type ThemePresetId = SiteTheme["presetTheme"]

export interface ThemePreset {
    label: string
    fonts: SiteThemeFonts
    colors: SiteThemeColors
}

/**
 * Starting points for the theme form. Picking one only fills the form; the site always renders
 * the saved fonts and colors, never the preset itself.
 */
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
