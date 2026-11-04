import { DESKTOP_GRID, MOBILE_GRID } from "@/lib/bento-grid"
import { hasSameTiles, normalizeBentoLayout } from "@/lib/bento-layout"
import { isRecord } from "@/lib/theme/record"
import { isHexColor } from "@/lib/theme/colors"
import { isSelectableFontName } from "@/lib/theme/fonts"
import type { BentoBoxLayout, BentoLayoutItem } from "@/types/bento"
import type { SiteThemeColors, SiteThemeFonts } from "@/types/theme"

export type ArtworkCatalog = {
    /** Works shown on the public site. */
    visibleArtPieceIds: Set<string>
    /** Image media usable on a tile, mapped to the work they belong to. */
    mediaArtPiece: Map<string, string>
}

export type BentoValidationResult =
    | { ok: true; layout: BentoBoxLayout }
    | { ok: false; message: string }

const INVALID_LAYOUT = "Układ kafelków jest niepoprawny. Odśwież stronę i spróbuj ponownie."

function readItems(layout: unknown, view: keyof BentoBoxLayout): unknown[] | null {
    if (!isRecord(layout) || !isRecord(layout[view])) return null
    const items = (layout[view] as { items?: unknown }).items
    return Array.isArray(items) ? items : null
}

function hasValidContent(
    item: BentoLayoutItem,
    savedTileIds: Set<string>,
    catalog: ArtworkCatalog
): boolean {
    if (catalog.mediaArtPiece.get(item.mediaId) !== item.artPieceId) return false
    return savedTileIds.has(item.tileId) || catalog.visibleArtPieceIds.has(item.artPieceId)
}

/**
 * Checks a layout sent from the editor. Every tile must fit its grid without overlapping, both
 * views must hold the same tiles, each image must belong to its work, and a tile that was not
 * saved before may only show a visible work.
 */
export function validateBentoLayout(
    next: unknown,
    savedTileIds: Set<string>,
    catalog: ArtworkCatalog
): BentoValidationResult {
    const desktopItems = readItems(next, "desktop")
    const mobileItems = readItems(next, "mobile")
    if (!desktopItems || !mobileItems) return { ok: false, message: INVALID_LAYOUT }

    const desktop = normalizeBentoLayout({ items: desktopItems }, DESKTOP_GRID)
    const mobile = normalizeBentoLayout({ items: mobileItems }, MOBILE_GRID)
    if (desktop.length !== desktopItems.length || mobile.length !== mobileItems.length) {
        return { ok: false, message: INVALID_LAYOUT }
    }
    if (!hasSameTiles(desktop, mobile)) return { ok: false, message: INVALID_LAYOUT }

    if (!desktop.every((item) => hasValidContent(item, savedTileIds, catalog))) {
        return {
            ok: false,
            message: "Jedna z wybranych prac albo jedno ze zdjęć nie jest już dostępne.",
        }
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

export function validateThemeInput(input: unknown): ThemeValidationResult {
    const fonts = isRecord(input) && isRecord(input.fonts) ? input.fonts : {}
    const colors = isRecord(input) && isRecord(input.colors) ? input.colors : {}
    const errors: ThemeErrors = {}

    for (const field of FONT_FIELDS) {
        if (!isSelectableFontName(fonts[field])) errors[field] = "Wybierz czcionkę z listy."
    }
    for (const field of COLOR_FIELDS) {
        if (!isHexColor(colors[field])) {
            errors[field] = "Podaj kolor w formacie #RRGGBB albo #RGB."
        }
    }

    if (Object.keys(errors).length > 0) return { ok: false, errors }

    return {
        ok: true,
        fonts: {
            primaryFont: fonts.primaryFont as string,
            secondaryFont: fonts.secondaryFont as string,
            additionalFont: fonts.additionalFont as string,
        },
        colors: {
            foregroundColor: colors.foregroundColor as string,
            backgroundColor: colors.backgroundColor as string,
            accentColor: colors.accentColor as string,
        },
    }
}
