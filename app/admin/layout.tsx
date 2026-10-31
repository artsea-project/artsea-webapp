import type { Metadata } from "next"

import AdminShell from "@/components/AdminShell"
import HtmlShell from "@/components/HtmlShell"

export const metadata: Metadata = {
    title: "Artsea Panel",
    description: "Panel administracyjny Artsea",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <HtmlShell lang="pl">
            <AdminShell>{children}</AdminShell>
        </HtmlShell>
    )
}
