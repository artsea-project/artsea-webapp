import { expect, test } from "@playwright/test"

import { validateThemeInput } from "../lib/appearance/validation"

const validTheme = {
    fonts: { primaryFont: "Lora", secondaryFont: "Inter", additionalFont: "Lato" },
    colors: { foregroundColor: "#1C1917", backgroundColor: "#abc", accentColor: "#2F7D4F" },
}

test("accepts catalog fonts and hex colors", () => {
    expect(validateThemeInput(validTheme)).toEqual({ ok: true, ...validTheme })
})

test("keeps only the theme fields of a valid input", () => {
    expect(
        validateThemeInput({
            fonts: { ...validTheme.fonts, extra: "Comic Sans" },
            colors: validTheme.colors,
            presetTheme: "dark",
        })
    ).toEqual({ ok: true, ...validTheme })
})

test("reports each invalid font and color", () => {
    expect(
        validateThemeInput({
            fonts: { ...validTheme.fonts, primaryFont: "Comic Sans", additionalFont: "Geist Mono" },
            colors: { ...validTheme.colors, accentColor: "#12" },
        })
    ).toEqual({
        ok: false,
        errors: {
            primaryFont: "Wybierz czcionkę z listy.",
            additionalFont: "Wybierz czcionkę z listy.",
            accentColor: "Podaj kolor w formacie #RRGGBB albo #RGB.",
        },
    })
})

test("reports every field when the input is not a theme", () => {
    const result = validateThemeInput(null)

    expect(result.ok).toBe(false)
    expect(Object.keys(result.ok ? {} : result.errors)).toHaveLength(6)
})
