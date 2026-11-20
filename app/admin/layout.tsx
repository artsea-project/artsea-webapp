import type { Metadata } from "next"
import { Suspense } from "react"
import { adminFontClassName } from "@/app/fonts"

export const metadata: Metadata = {
    title: "Artsea Panel",
    description: "Panel administracyjny Artsea",
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className={adminFontClassName}>
            <Suspense fallback={null}>{children}</Suspense>
        </div>
    )
}
