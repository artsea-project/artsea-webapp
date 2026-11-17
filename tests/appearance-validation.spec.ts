import { expect, test } from "@playwright/test"

import {
    validateBentoLayout,
    validateThemeInput,
    type ArtworkCatalog,
} from "../lib/appearance/validation"
import type { BentoBoxLayout, BentoLayoutItem } from "../types/bento"

const visibleWork = "a7f3bc01-0000-4000-8000-000000000101"
const hiddenWork = "a7f3bc01-0000-4000-8000-000000000102"
const visibleImage = "a7f3bc01-0000-4000-8000-000000000201"
const hiddenImage = "a7f3bc01-0000-4000-8000-000000000202"
const firstTile = "a7f3bc01-0000-4000-8000-000000000501"
const secondTile = "a7f3bc01-0000-4000-8000-000000000502"

const catalog: ArtworkCatalog = {
    visibleArtPieceIds: new Set([visibleWork]),
    mediaArtPiece: new Map([
        [visibleImage, visibleWork],
        [hiddenImage, hiddenWork],
    ]),
}

function tile(
    tileId: string,
    columnStart = 1,
    artPieceId = visibleWork,
    mediaId = visibleImage
): BentoLayoutItem {
    return { tileId, artPieceId, mediaId, columnStart, rowStart: 1, columnSpan: 3, rowSpan: 3 }
}

function both(...items: BentoLayoutItem[]): BentoBoxLayout {
    return { desktop: { items }, mobile: { items: items.map((item) => ({ ...item })) } }
}

function validate(layout: unknown, savedTiles: BentoLayoutItem[] = []) {
    const savedTileWorks = new Map(savedTiles.map((item) => [item.tileId, item.artPieceId]))
    return validateBentoLayout(layout, savedTileWorks, catalog)
}

test("accepts a layout with the same tiles in both views", () => {
    const layout = both(tile(firstTile), tile(secondTile, 4))
    expect(validate(layout)).toEqual({ ok: true, layout })
})

test("accepts an empty layout", () => {
    expect(validate(both()).ok).toBe(true)
})

test("rejects different tile sets in the two views", () => {
    const layout: BentoBoxLayout = {
        desktop: { items: [tile(firstTile)] },
        mobile: { items: [] },
    }
    expect(validate(layout).ok).toBe(false)
})

test("rejects tiles outside the grid or overlapping instead of dropping them", () => {
    expect(validate(both(tile(firstTile, 11))).ok).toBe(false)
    expect(validate(both(tile(firstTile), tile(secondTile))).ok).toBe(false)
})

test("rejects a layout without both views", () => {
    expect(validate({ desktop: { items: [] } }).ok).toBe(false)
    expect(validate(null).ok).toBe(false)
})

test("rejects an image that belongs to another work or no longer exists", () => {
    expect(validate(both(tile(firstTile, 1, visibleWork, hiddenImage))).ok).toBe(false)
    expect(
        validate(both(tile(firstTile, 1, visibleWork, "a7f3bc01-0000-4000-8000-000000000299")))
    ).toEqual({
        ok: false,
        message: "Jedna z wybranych prac albo jedno ze zdjęć nie jest już dostępne.",
    })
})

test("rejects a new tile with a hidden work but keeps an already saved one", () => {
    const savedHiddenTile = tile(firstTile, 1, hiddenWork, hiddenImage)
    const hiddenTile = both(savedHiddenTile)

    expect(validate(hiddenTile).ok).toBe(false)
    expect(validate(hiddenTile, [savedHiddenTile]).ok).toBe(true)
})

test("rejects a hidden work put on a saved tile that showed another work", () => {
    const swapped = both(tile(firstTile, 1, hiddenWork, hiddenImage))

    expect(validate(swapped, [tile(firstTile)])).toEqual({
        ok: false,
        message: "Jedna z wybranych prac albo jedno ze zdjęć nie jest już dostępne.",
    })
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
