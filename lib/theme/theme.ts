import type { SiteTheme, SiteThemeFonts } from "@/types/theme"
import { defaultThemeColors, resolveThemeColors, type ThemeColorVariables } from "./colors"
import {
    defaultThemeFonts,
    resolveThemeFonts,
    type ResolvedThemeFonts,
    type ThemeFontVariables,
} from "./fonts"

export const defaultSiteTheme = {
    fonts: defaultThemeFonts,
    colors: defaultThemeColors,
    presetTheme: "default",
    darkModeExperimental: false,
} as const satisfies SiteTheme

export type ThemeVariables = ThemeFontVariables & ThemeColorVariables

export interface ResolvedSiteTheme {
    fontNames: ResolvedThemeFonts["fontNames"]
    variables: ThemeVariables
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null
}

export function resolveSiteTheme(theme: unknown): ResolvedSiteTheme {
    const values = isRecord(theme) ? theme : {}
    const fonts = isRecord(values.fonts) ? (values.fonts as Partial<SiteThemeFonts>) : null
    const resolvedFonts = resolveThemeFonts(fonts)

    return {
        fontNames: resolvedFonts.fontNames,
        variables: {
            ...resolvedFonts.variables,
            ...resolveThemeColors(values.colors),
        },
    }
}
