import { cacheLife, cacheTag } from "next/cache"

import type { SiteThemeFonts } from "@/types/theme"

export const SITE_THEME_CACHE_TAG = "site-theme"

async function loadSiteThemeFonts(): Promise<SiteThemeFonts | null> {
    "use cache"

    cacheLife("max")
    cacheTag(SITE_THEME_CACHE_TAG)

    try {
        const { db } = await import("@/db")
        const settings = await db.query.siteSettings.findFirst({
            columns: {
                theme: true,
            },
        })

        return settings?.theme?.fonts ?? null
    } catch {
        return null
    }
}

export async function getSiteThemeFonts(): Promise<SiteThemeFonts | null> {
    if (!process.env.DATABASE_URL) {
        return null
    }

    return loadSiteThemeFonts()
}
