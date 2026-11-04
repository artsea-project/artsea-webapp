import { Suspense } from "react"

import FeaturedWorksPreview from "@/components/admin-overview/FeaturedWorksPreview"
import OverviewStatCards from "@/components/admin-overview/OverviewStatCards"
import SocialLinksSummary from "@/components/admin-overview/SocialLinksSummary"
import { getOverviewStats } from "@/lib/admin-overview/queries"
import { getAppearanceData } from "@/lib/appearance/queries"
import { getOrderedLinks } from "@/lib/profile/queries"

export default function AdminOverviewPage() {
    return (
        <Suspense fallback={null}>
            <OverviewContent />
        </Suspense>
    )
}

async function OverviewContent() {
    const [stats, appearance, links] = await Promise.all([
        getOverviewStats(),
        getAppearanceData(),
        getOrderedLinks(),
    ])

    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex w-full flex-col gap-9">
                <div className="mb-3">
                    <h2 className="text-2xl font-bold text-foreground">Przegląd zawartości</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Podsumowanie dodanych elementów, zarządzanie kategoriami i tagami.
                    </p>
                </div>
                <OverviewStatCards stats={stats} />
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-11">
                    <FeaturedWorksPreview tiles={appearance.layout.desktop.items} />
                    <SocialLinksSummary links={links} />
                </div>
            </div>
        </div>
    )
}
