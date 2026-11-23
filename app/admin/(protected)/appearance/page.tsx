import { Suspense } from "react"

import { AppearanceEditor } from "@/components/admin-appearance/AppearanceEditor"
import { requireArtistSession } from "@/lib/auth/session"
import { getAppearanceData } from "@/lib/appearance/queries"

export const instant = false

export default function AdminAppearancePage() {
    return (
        <Suspense fallback={null}>
            <AppearanceContent />
        </Suspense>
    )
}

async function AppearanceContent() {
    await requireArtistSession()
    const data = await getAppearanceData()

    return (
        <div data-leave-guard-root className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <AppearanceEditor data={data} />
        </div>
    )
}
