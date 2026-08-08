import { connection } from "next/server"
import type { SiteThemeFonts } from "@/types/theme"

export async function getSiteThemeFonts(): Promise<SiteThemeFonts | null> {
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

        return settings?.theme?.fonts ?? null
    } catch {
        return null
    }
}
