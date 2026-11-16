"use server"

import { refresh, updateTag } from "next/cache"

import { db } from "@/db"
import { siteSettings } from "@/db/schema"
import { getSavedSiteSettings } from "@/lib/appearance/queries"
import { validateThemeInput, type ThemeErrors } from "@/lib/appearance/validation"
import { SITE_THEME_CACHE_TAG } from "@/lib/theme/get-site-theme"
import { defaultSiteTheme } from "@/lib/theme/theme"
import type { BentoBoxLayout } from "@/types/bento"
import type { SiteTheme, SiteThemeColors, SiteThemeFonts } from "@/types/theme"

export type SaveThemeResult = { status: "success" } | { status: "error"; errors: ThemeErrors }

const emptyLayout: BentoBoxLayout = { desktop: { items: [] }, mobile: { items: [] } }

async function upsertSiteSettings(values: { theme?: SiteTheme; layoutBentoBox?: BentoBoxLayout }) {
    await db
        .insert(siteSettings)
        .values({ theme: defaultSiteTheme, layoutBentoBox: emptyLayout, ...values })
        .onConflictDoUpdate({ target: siteSettings.isSingleton, set: values })
}

export async function saveSiteTheme(input: {
    fonts: SiteThemeFonts
    colors: SiteThemeColors
}): Promise<SaveThemeResult> {
    const result = validateThemeInput(input)
    if (!result.ok) return { status: "error", errors: result.errors }

    const saved = (await getSavedSiteSettings())?.theme ?? defaultSiteTheme
    await upsertSiteSettings({
        theme: { ...defaultSiteTheme, ...saved, fonts: result.fonts, colors: result.colors },
    })
    updateTag(SITE_THEME_CACHE_TAG)
    refresh()
    return { status: "success" }
}
