import type { SiteThemeColors } from "@/types/theme"

export const defaultThemeColors = {
    primaryColor: "#292524",
    secondaryColor: "#A8A29E",
    foregroundColor: "#1C1917",
    accentColor: "#A8A29E",
    backgroundColor: "#FFFFFF",
} as const satisfies SiteThemeColors

export type ThemeColorVariables = {
    "--primary": string
    "--secondary": string
    "--foreground": string
    "--accent": string
    "--background": string
}

const CSS_HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null
}

function resolveColor(value: unknown, fallback: string): string {
    return typeof value === "string" && CSS_HEX_COLOR.test(value) ? value : fallback
}

export function resolveThemeColors(colors: unknown): ThemeColorVariables {
    const values = isRecord(colors) ? colors : {}

    return {
        "--primary": resolveColor(values.primaryColor, defaultThemeColors.primaryColor),
        "--secondary": resolveColor(values.secondaryColor, defaultThemeColors.secondaryColor),
        "--foreground": resolveColor(
            values.foregroundColor ?? values.additionalColor,
            defaultThemeColors.foregroundColor
        ),
        "--accent": resolveColor(values.accentColor, defaultThemeColors.accentColor),
        "--background": resolveColor(values.backgroundColor, defaultThemeColors.backgroundColor),
    }
}
