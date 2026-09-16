import type { Metadata } from "next"
import { Suspense } from "react"

import { adminFontClassName } from "@/app/fonts"
import HtmlShell from "@/components/HtmlShell"

export const metadata: Metadata = {
    title: "Artsea Panel",
    description: "Panel administracyjny Artsea",
    robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <HtmlShell lang="pl">
            <div className={adminFontClassName}>
                <Suspense fallback={null}>{children}</Suspense>
            </div>
        </HtmlShell>
    )
}
