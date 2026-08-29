import Link from "next/link"
import { db } from "@/db"
import NavLinks from "@/components/NavLinks"

export default async function Header() {
    let profile = null
    let settings = null

    if (process.env.DATABASE_URL) {
        try {
            const [profileResult, settingsResult] = await Promise.all([
                db.query.profiles.findFirst(),
                db.query.siteSettings.findFirst(),
            ])
            profile = profileResult
            settings = settingsResult
        } catch {
            // Fallback to default values if database is offline or uninitialized
        }
    }

    const artistName = profile?.fullName

    const primaryColor = settings?.theme?.colors.primaryColor || "#292524"

    return (
        <header className="w-full">
            <div className="max-w-7xl mx-auto py-8 px-6 md:py-12 md:px-16 flex items-center justify-between relative">
                <Link
                    href="/"
                    className="font-primary text-2xl md:text-3xl font-bold tracking-tight hover:opacity-90 transition-opacity"
                    style={{ color: primaryColor }}
                >
                    {artistName}
                </Link>

                <NavLinks />
            </div>
        </header>
    )
}
