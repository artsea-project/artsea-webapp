import type { Metadata } from "next"
import { Suspense } from "react"

import AdminPageHeader from "@/components/AdminPageHeader"
import AdminSidebar from "@/components/AdminSidebar"

export const metadata: Metadata = {
    title: "Artsea Panel",
    description: "Panel administracyjny Artsea",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Suspense fallback={null}>
                <AdminSidebar />
            </Suspense>
            <main className="min-w-0 flex-1 overflow-y-auto">
                <AdminPageHeader />
                {children}
            </main>
        </div>
    )
}
