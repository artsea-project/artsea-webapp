import { cacheLife, cacheTag } from "next/cache"

import type { SiteTheme } from "@/types/theme"

export const SITE_THEME_CACHE_TAG = "site-theme"

async function loadSiteTheme(): Promise<SiteTheme | null> {
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

        return settings?.theme ?? null
    } catch {
        return null
    }
}

export async function getSiteTheme(): Promise<SiteTheme | null> {
    if (!process.env.DATABASE_URL) {
        return null
    }

    return loadSiteTheme()
}
