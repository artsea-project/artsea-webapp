import { User } from "lucide-react"

import AdminSidebarNav from "@/components/AdminSidebarNav"

async function getArtistName() {
    if (!process.env.DATABASE_URL) {
        return null
    }

    try {
        const { db } = await import("@/db")
        const profile = await db.query.profiles.findFirst({ columns: { fullName: true } })

        return profile?.fullName ?? null
    } catch {
        // Render without a name if the database is offline or uninitialized
        return null
    }
}

export default async function AdminSidebar() {
    const artistName = await getArtistName()

    return (
        <aside className="flex h-full w-65 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 pt-5 pb-10 font-secondary">
            {artistName && (
                <div className="flex items-center gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-900">
                        <User className="size-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="text-base font-bold text-slate-900">{artistName}</span>
                </div>
            )}

            <AdminSidebarNav />
        </aside>
    )
}
