import { isHexColor } from "@/lib/theme/colors"
import { isSelectableFontName } from "@/lib/theme/fonts"
import { isRecord } from "@/lib/theme/record"
import type { SiteThemeColors, SiteThemeFonts } from "@/types/theme"

export type ThemeField = keyof SiteThemeFonts | keyof SiteThemeColors

export type ThemeErrors = Partial<Record<ThemeField, string>>

export type ThemeValidationResult =
    | { ok: true; fonts: SiteThemeFonts; colors: SiteThemeColors }
    | { ok: false; errors: ThemeErrors }

const FONT_FIELDS = ["primaryFont", "secondaryFont", "additionalFont"] as const
const COLOR_FIELDS = ["foregroundColor", "backgroundColor", "accentColor"] as const

const FONT_ERROR = "Wybierz czcionkę z listy."
const COLOR_ERROR = "Podaj kolor w formacie #RRGGBB albo #RGB."

function readGroup(input: unknown, key: "fonts" | "colors"): Record<string, unknown> {
    const group = isRecord(input) ? input[key] : undefined
    return isRecord(group) ? group : {}
}

function pickFields<Field extends string>(
    source: Record<string, unknown>,
    fields: readonly Field[]
): Record<Field, string> {
    return Object.fromEntries(fields.map((field) => [field, source[field]])) as Record<
        Field,
        string
    >
}

export function validateThemeInput(input: unknown): ThemeValidationResult {
    const fonts = readGroup(input, "fonts")
    const colors = readGroup(input, "colors")
    const errors: ThemeErrors = {}

    for (const field of FONT_FIELDS) {
        if (!isSelectableFontName(fonts[field])) errors[field] = FONT_ERROR
    }
    for (const field of COLOR_FIELDS) {
        if (!isHexColor(colors[field])) errors[field] = COLOR_ERROR
    }

    if (Object.keys(errors).length > 0) return { ok: false, errors }

    return {
        ok: true,
        fonts: pickFields(fonts, FONT_FIELDS),
        colors: pickFields(colors, COLOR_FIELDS),
    }
}
