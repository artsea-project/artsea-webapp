import Link from "next/link"
import { db } from "@/db"
import NavLinks from "@/components/NavLinks"

export default async function Header() {
    let profile = null

    if (process.env.DATABASE_URL) {
        try {
            profile = await db.query.profiles.findFirst()
        } catch {
            // Fallback to the default artist name if the database is unavailable
        }
    }

    const rawName = profile?.fullName || "Élise Roux."
    const artistName = rawName.endsWith(".") ? rawName : `${rawName}.`

    return (
        <header className="w-full">
            <div className="max-w-7xl mx-auto py-8 px-6 md:py-12 md:px-16 flex items-center justify-between relative">
                <Link
                    href="/"
                    className="font-primary text-primary text-2xl md:text-3xl font-bold tracking-tight hover:opacity-90 transition-opacity"
                >
                    {artistName}
                </Link>

                <NavLinks />
            </div>
        </header>
    )
}
