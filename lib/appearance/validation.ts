import { DESKTOP_GRID, MOBILE_GRID } from "@/lib/bento-grid"
import { hasSameTiles, normalizeBentoLayout } from "@/lib/bento-layout"
import { isHexColor } from "@/lib/theme/colors"
import { isSelectableFontName } from "@/lib/theme/fonts"
import { isRecord } from "@/lib/theme/record"
import type { BentoBoxLayout, BentoLayoutItem } from "@/types/bento"
import type { SiteThemeColors, SiteThemeFonts } from "@/types/theme"

export type ArtworkCatalog = {
    visibleArtPieceIds: Set<string>
    mediaArtPiece: Map<string, string>
}

export type BentoValidationResult =
    | { ok: true; layout: BentoBoxLayout }
    | { ok: false; message: string }

const INVALID_LAYOUT = "Układ kafelków jest niepoprawny. Odśwież stronę i spróbuj ponownie."
const UNAVAILABLE_CONTENT = "Jedna z wybranych prac albo jedno ze zdjęć nie jest już dostępne."

function hasValidContent(
    item: BentoLayoutItem,
    savedTileWorks: Map<string, string>,
    catalog: ArtworkCatalog
): boolean {
    if (catalog.mediaArtPiece.get(item.mediaId) !== item.artPieceId) return false
    return (
        savedTileWorks.get(item.tileId) === item.artPieceId ||
        catalog.visibleArtPieceIds.has(item.artPieceId)
    )
}

function readViewItems(layout: unknown, view: keyof BentoBoxLayout): unknown[] | null {
    const items = isRecord(layout) && isRecord(layout[view]) ? layout[view].items : undefined
    return Array.isArray(items) ? items : null
}

export function validateBentoLayout(
    next: unknown,
    savedTileWorks: Map<string, string>,
    catalog: ArtworkCatalog
): BentoValidationResult {
    const desktopItems = readViewItems(next, "desktop")
    const mobileItems = readViewItems(next, "mobile")
    if (!desktopItems || !mobileItems) return { ok: false, message: INVALID_LAYOUT }

    const desktop = normalizeBentoLayout({ items: desktopItems }, DESKTOP_GRID)
    const mobile = normalizeBentoLayout({ items: mobileItems }, MOBILE_GRID)
    const droppedAnyTile =
        desktop.length !== desktopItems.length || mobile.length !== mobileItems.length
    if (droppedAnyTile || !hasSameTiles(desktop, mobile)) {
        return { ok: false, message: INVALID_LAYOUT }
    }
    if (!desktop.every((item) => hasValidContent(item, savedTileWorks, catalog))) {
        return { ok: false, message: UNAVAILABLE_CONTENT }
    }

    return { ok: true, layout: { desktop: { items: desktop }, mobile: { items: mobile } } }
}

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
