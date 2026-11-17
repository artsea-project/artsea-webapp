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

export function isHexColor(value: unknown): value is string {
    return typeof value === "string" && CSS_HEX_COLOR.test(value)
}

function toLongHex(value: string): string {
    const digits = value.slice(1)
    const long = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits
    return `#${long.toUpperCase()}`
}

export function isSameColor(left: string, right: string): boolean {
    return toLongHex(left) === toLongHex(right)
}

function resolveColor(value: unknown, fallback: string): string {
    return isHexColor(value) ? value : fallback
}

export function resolveThemeColors(colors: unknown): ThemeColorVariables {
    const values = isRecord(colors) ? colors : {}
    return {
        "--foreground": resolveColor(values.foregroundColor, defaultThemeColors.foregroundColor),
        "--background": resolveColor(values.backgroundColor, defaultThemeColors.backgroundColor),
        "--primary": resolveColor(values.accentColor, defaultThemeColors.accentColor),
    }
}
