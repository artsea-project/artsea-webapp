import type { SiteThemeColors } from "@/types/theme"
import { isRecord } from "./record"

export const defaultThemeColors = {
    foregroundColor: "#1C1917",
    backgroundColor: "#FFFFFF",
    accentColor: "#A8A29E",
} as const satisfies SiteThemeColors

export type ThemeColorVariables = {
    "--foreground": string
    "--background": string
    "--primary": string
}

const CSS_HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{6})$/i

function resolveColor(value: unknown, fallback: string): string {
    return typeof value === "string" && CSS_HEX_COLOR.test(value) ? value : fallback
}

export function resolveThemeColors(colors: unknown): ThemeColorVariables {
    const values = isRecord(colors) ? colors : {}
    return {
        "--foreground": resolveColor(values.foregroundColor, defaultThemeColors.foregroundColor),
        "--background": resolveColor(values.backgroundColor, defaultThemeColors.backgroundColor),
        "--primary": resolveColor(values.accentColor, defaultThemeColors.accentColor),
    }
}
