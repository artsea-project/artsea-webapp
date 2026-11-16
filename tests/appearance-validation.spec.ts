import { expect, test } from "@playwright/test"

import { validateBentoLayout, validateThemeInput } from "../lib/appearance/validation"
import type { BentoBoxLayout, BentoLayoutItem } from "../types/bento"

const work = "a7f3bc01-0000-4000-8000-000000000101"
const image = "a7f3bc01-0000-4000-8000-000000000201"
const firstTile = "a7f3bc01-0000-4000-8000-000000000501"
const secondTile = "a7f3bc01-0000-4000-8000-000000000502"

function tile(tileId: string, columnStart = 1): BentoLayoutItem {
    return {
        tileId,
        artPieceId: work,
        mediaId: image,
        columnStart,
        rowStart: 1,
        columnSpan: 3,
        rowSpan: 3,
    }
}

function both(...items: BentoLayoutItem[]): BentoBoxLayout {
    return { desktop: { items }, mobile: { items: items.map((item) => ({ ...item })) } }
}

test("accepts a layout with the same tiles in both views", () => {
    const layout = both(tile(firstTile), tile(secondTile, 4))
    expect(validateBentoLayout(layout)).toEqual({ ok: true, layout })
})

test("accepts an empty layout", () => {
    expect(validateBentoLayout(both()).ok).toBe(true)
})

test("rejects different tile sets in the two views", () => {
    const layout: BentoBoxLayout = {
        desktop: { items: [tile(firstTile)] },
        mobile: { items: [] },
    }
    expect(validateBentoLayout(layout).ok).toBe(false)
})

test("rejects tiles outside the grid or overlapping instead of dropping them", () => {
    expect(validateBentoLayout(both(tile(firstTile, 11))).ok).toBe(false)
    expect(validateBentoLayout(both(tile(firstTile), tile(secondTile))).ok).toBe(false)
})

test("rejects a layout without both views", () => {
    expect(validateBentoLayout({ desktop: { items: [] } }).ok).toBe(false)
    expect(validateBentoLayout(null).ok).toBe(false)
})

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
