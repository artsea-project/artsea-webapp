import ProfileAvatar from "@/components/admin-profile/ProfileAvatar"
import AdminSidebarNav from "@/components/AdminSidebarNav"
import { profileImagePath } from "@/lib/profile/image"

async function loadSidebarProfile() {
    if (!process.env.DATABASE_URL) {
        return null
    }

    try {
        const { getSidebarProfile } = await import("@/lib/profile/queries")
        return await getSidebarProfile()
    } catch {
        // Render without a name if the database is offline or uninitialized
        return null
    }
}

export default async function AdminSidebar() {
    const profile = await loadSidebarProfile()

    return (
        <aside className="flex h-full w-65 shrink-0 flex-col overflow-y-auto border-r border-border bg-background px-4 pt-5 pb-10 font-secondary">
            {profile && (
                <div className="flex items-center gap-4">
                    <ProfileAvatar
                        src={profile.imageHash ? profileImagePath(profile.imageHash) : null}
                        alt={profile.fullName}
                        className="size-9"
                    />
                    <span className="text-base font-bold text-foreground">{profile.fullName}</span>
                </div>
            )}

            <AdminSidebarNav />
        </aside>
    )
}
