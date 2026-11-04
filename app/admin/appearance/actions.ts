"use server"

import { refresh, updateTag } from "next/cache"

import { db } from "@/db"
import { siteSettings } from "@/db/schema"
import { getArtworkCatalog, getSavedSiteSettings } from "@/lib/appearance/queries"
import {
    validateBentoLayout,
    validateThemeInput,
    type ThemeErrors,
} from "@/lib/appearance/validation"
import { BENTO_CACHE_TAG } from "@/lib/bento"
import { DESKTOP_GRID } from "@/lib/bento-grid"
import { normalizeBentoLayout } from "@/lib/bento-layout"
import { SITE_THEME_CACHE_TAG } from "@/lib/theme/get-site-theme"
import { isRecord } from "@/lib/theme/record"
import { defaultSiteTheme } from "@/lib/theme/theme"
import type { BentoBoxLayout } from "@/types/bento"
import type { SiteTheme, SiteThemeColors, SiteThemeFonts } from "@/types/theme"

export type SaveBentoResult = { status: "success" } | { status: "error"; message: string }

export type SaveThemeResult = { status: "success" } | { status: "error"; errors: ThemeErrors }

const emptyLayout: BentoBoxLayout = { desktop: { items: [] }, mobile: { items: [] } }

/** site_settings holds a single row; write into it, creating it on first save. */
async function upsertSiteSettings(values: { theme?: SiteTheme; layoutBentoBox?: BentoBoxLayout }) {
    await db
        .insert(siteSettings)
        .values({ theme: defaultSiteTheme, layoutBentoBox: emptyLayout, ...values })
        .onConflictDoUpdate({ target: siteSettings.isSingleton, set: values })
}

export async function saveBentoLayout(layout: BentoBoxLayout): Promise<SaveBentoResult> {
    const [settings, catalog] = await Promise.all([getSavedSiteSettings(), getArtworkCatalog()])
    const saved = isRecord(settings?.layoutBentoBox) ? settings.layoutBentoBox.desktop : undefined
    const savedTileIds = new Set(
        normalizeBentoLayout(saved, DESKTOP_GRID).map((item) => item.tileId)
    )

    const result = validateBentoLayout(layout, savedTileIds, catalog)
    if (!result.ok) return { status: "error", message: result.message }

    await upsertSiteSettings({ layoutBentoBox: result.layout })
    updateTag(BENTO_CACHE_TAG)
    return { status: "success" }
}

export async function saveSiteTheme(input: {
    fonts: SiteThemeFonts
    colors: SiteThemeColors
}): Promise<SaveThemeResult> {
    const result = validateThemeInput(input)
    if (!result.ok) return { status: "error", errors: result.errors }

    // Only fonts and colors are edited here; the remaining theme fields keep their saved values.
    const saved = (await getSavedSiteSettings())?.theme ?? defaultSiteTheme
    await upsertSiteSettings({
        theme: { ...defaultSiteTheme, ...saved, fonts: result.fonts, colors: result.colors },
    })
    updateTag(SITE_THEME_CACHE_TAG)
    // The admin panel's own document fonts come from the site theme too.
    refresh()
    return { status: "success" }
}
