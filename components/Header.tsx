import NavLinks from "@/components/NavLinks"
import { Link } from "@/i18n/navigation"
import { getArtistName } from "@/lib/profile/queries"

async function loadArtistName() {
    if (!process.env.DATABASE_URL) {
        return null
    }

    try {
        return await getArtistName()
    } catch {
        // Render without a name if the database is offline or uninitialized
        return null
    }
}

export default async function Header() {
    const artistName = await loadArtistName()

    return (
        <header className="w-full">
            <div className="page-container relative flex items-center justify-between py-8 md:py-12">
                <Link
                    href="/"
                    className="font-primary text-foreground text-2xl md:text-3xl font-bold tracking-tight hover:opacity-90 transition-opacity"
                >
                    {artistName}
                </Link>

                <NavLinks />
            </div>
        </header>
    )
}
