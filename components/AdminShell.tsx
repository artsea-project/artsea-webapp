import { Suspense, type ReactNode } from "react"

import AdminPageHeader from "@/components/AdminPageHeader"
import AdminSidebar, { AdminSidebarContent } from "@/components/AdminSidebar"

export default function AdminShell({ children }: { children: ReactNode }) {
    return (
        <div className="admin-theme flex h-screen overflow-hidden bg-background text-foreground">
            <Suspense fallback={null}>
                <AdminSidebar />
            </Suspense>
            <main className="min-w-0 flex-1 overflow-y-auto bg-surface">
                <AdminPageHeader
                    menu={
                        <Suspense fallback={null}>
                            <AdminSidebarContent />
                        </Suspense>
                    }
                />
                {children}
            </main>
        </div>
    )
}
