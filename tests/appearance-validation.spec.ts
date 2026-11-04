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
const savedTile = "a7f3bc01-0000-4000-8000-000000000501"
const newTile = "a7f3bc01-0000-4000-8000-000000000502"

const catalog: ArtworkCatalog = {
    visibleArtPieceIds: new Set([visibleWork]),
    mediaArtPiece: new Map([
        [visibleImage, visibleWork],
        [hiddenImage, hiddenWork],
    ]),
}

function tile(
    tileId: string,
    artPieceId: string,
    mediaId: string,
    columnStart = 1
): BentoLayoutItem {
    return { tileId, artPieceId, mediaId, columnStart, rowStart: 1, columnSpan: 3, rowSpan: 3 }
}

function both(...items: BentoLayoutItem[]): BentoBoxLayout {
    return { desktop: { items }, mobile: { items: items.map((item) => ({ ...item })) } }
}

test("accepts a layout with the same tiles in both views", () => {
    const layout = both(tile(newTile, visibleWork, visibleImage))
    expect(validateBentoLayout(layout, new Set(), catalog)).toEqual({ ok: true, layout })
})

test("accepts an empty layout", () => {
    expect(validateBentoLayout(both(), new Set(), catalog).ok).toBe(true)
})

test("rejects different tile sets in the two views", () => {
    const layout: BentoBoxLayout = {
        desktop: { items: [tile(newTile, visibleWork, visibleImage)] },
        mobile: { items: [] },
    }
    expect(validateBentoLayout(layout, new Set(), catalog).ok).toBe(false)
})

test("rejects an image that belongs to another work", () => {
    const layout = both(tile(newTile, visibleWork, hiddenImage))
    expect(validateBentoLayout(layout, new Set(), catalog).ok).toBe(false)
})

test("rejects a new tile with a hidden work but keeps an already saved one", () => {
    expect(
        validateBentoLayout(both(tile(newTile, hiddenWork, hiddenImage)), new Set(), catalog).ok
    ).toBe(false)
    expect(
        validateBentoLayout(
            both(tile(savedTile, hiddenWork, hiddenImage)),
            new Set([savedTile]),
            catalog
        ).ok
    ).toBe(true)
})

test("rejects tiles outside the grid or overlapping", () => {
    expect(
        validateBentoLayout(both(tile(newTile, visibleWork, visibleImage, 11)), new Set(), catalog)
            .ok
    ).toBe(false)
    expect(
        validateBentoLayout(
            both(
                tile(savedTile, visibleWork, visibleImage),
                tile(newTile, visibleWork, visibleImage, 2)
            ),
            new Set(),
            catalog
        ).ok
    ).toBe(false)
    expect(validateBentoLayout({ desktop: {} }, new Set(), catalog).ok).toBe(false)
})

const validTheme = {
    fonts: { primaryFont: "Lora", secondaryFont: "Inter", additionalFont: "Lato" },
    colors: { foregroundColor: "#1C1917", backgroundColor: "#abc", accentColor: "#2F7D4F" },
}

test("accepts catalog fonts and hex colors", () => {
    expect(validateThemeInput(validTheme)).toEqual({ ok: true, ...validTheme })
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
