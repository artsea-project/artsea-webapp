import Link from "next/link"
import { db } from "@/db"
import { SiteTheme } from "@/types/theme"
import NavLinks from "@/components/NavLinks"

export const dynamic = "force-dynamic"

export default async function Header() {
    let user = null
    let settings = null

    if (process.env.DATABASE_URL) {
        try {
            user = await db.query.users.findFirst({
                with: {
                    profile: true,
                },
            })
            settings = await db.query.siteSettings.findFirst()
        } catch {
            // Fallback to default values if database is offline or uninitialized
        }
    }

    const theme = settings?.theme as SiteTheme | undefined
    const rawName = user?.profile?.fullName || "Élise Roux."
    const artistName = rawName.endsWith(".") ? rawName : `${rawName}.`

    const primaryColor = theme?.colors.primaryColor || "#292524"
    const primaryFontName = theme?.fonts.primaryFont
    const headingFont = primaryFontName
        ? `"${primaryFontName}", var(--font-playfair), serif`
        : "var(--font-playfair), serif"

    const secondaryFontName = theme?.fonts.secondaryFont || theme?.fonts.additionalFont
    const bodyFont = secondaryFontName
        ? `"${secondaryFontName}", var(--font-inter), sans-serif`
        : "var(--font-inter), sans-serif"

    return (
        <header className="w-full">
            <div className="max-w-7xl mx-auto py-8 px-6 md:py-12 md:px-16 flex items-center justify-between relative">
                <Link
                    href="/"
                    className="text-2xl md:text-3xl font-bold tracking-tight hover:opacity-90 transition-opacity"
                    style={{
                        fontFamily: headingFont,
                        color: primaryColor,
                    }}
                >
                    {artistName}
                </Link>

                <NavLinks bodyFont={bodyFont} />
            </div>
        </header>
    )
}
