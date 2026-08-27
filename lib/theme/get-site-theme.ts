import { connection } from "next/server"
import type { SiteTheme } from "@/types/theme"

export async function getSiteTheme(): Promise<SiteTheme | null> {
    if (!process.env.DATABASE_URL) {
        return null
    }

    await connection()

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
