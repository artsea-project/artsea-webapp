import Link from "next/link"
import { db } from "@/db"
import NavLinks from "@/components/NavLinks"

export default async function Header() {
    let user = null

    if (process.env.DATABASE_URL) {
        try {
            user = await db.query.users.findFirst({
                with: {
                    profile: true,
                    siteSettings: true,
                },
            })
        } catch {
            // Fallback to default values if database is offline or uninitialized
        }
    }

    const rawName = user?.profile?.fullName || "Élise Roux."
    const artistName = rawName.endsWith(".") ? rawName : `${rawName}.`

    const primaryColor = user?.siteSettings?.theme?.colors.primaryColor || "#292524"

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
