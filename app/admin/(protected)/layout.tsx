import { Suspense } from "react"
import AdminPageHeader from "@/components/AdminPageHeader"
import AdminSidebar, { AdminSidebarContent } from "@/components/AdminSidebar"
import { requireArtistSession } from "@/lib/auth/session"

export default async function ProtectedAdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    await requireArtistSession()

    return (
        <div className="admin-theme flex h-screen overflow-hidden bg-background text-foreground">
            <Suspense fallback={null}>
                <AdminSidebar />
            </Suspense>
            <main className="min-w-0 flex-1 overflow-y-auto bg-surface">
                <Suspense fallback={null}>
                    <AdminPageHeader
                        menu={
                            <Suspense fallback={null}>
                                <AdminSidebarContent />
                            </Suspense>
                        }
                    />
                </Suspense>
                {children}
            </main>
        </div>
    )
}
