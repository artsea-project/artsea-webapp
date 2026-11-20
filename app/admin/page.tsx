import { Suspense } from "react"
import { Folder, Hash, Image as ImageIcon } from "lucide-react"

import FeaturedWorks from "@/components/admin-overview/FeaturedWorks"
import OverviewPanel from "@/components/admin-overview/OverviewPanel"
import SocialLinks from "@/components/admin-overview/SocialLinks"
import StatCard from "@/components/admin-overview/StatCard"
import AdminPageIntro from "@/components/AdminPageIntro"
import { getBentoData } from "@/lib/bento"
import { describeHiddenWorks } from "@/lib/overview/hidden-works"
import { getOverviewCounts } from "@/lib/overview/queries"
import { getOrderedLinks } from "@/lib/profile/queries"

export default function AdminOverviewPage() {
    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex max-w-267 flex-col gap-8">
                <AdminPageIntro
                    title="Przegląd zawartości"
                    description="Podsumowanie prac, kategorii i tagów oraz tego, co widać na stronie głównej."
                />
                <Suspense fallback={null}>
                    <OverviewContent />
                </Suspense>
            </div>
        </div>
    )
}

async function OverviewContent() {
    const [counts, bento, links] = await Promise.all([
        getOverviewCounts(),
        getBentoData(),
        getOrderedLinks(),
    ])

    return (
        <>
            <div className="grid gap-6 sm:grid-cols-3">
                <StatCard
                    label="Dodane prace"
                    value={counts.works}
                    icon={ImageIcon}
                    href="/admin/works"
                    note={describeHiddenWorks(counts.hiddenWorks)}
                />
                <StatCard
                    label="Kategorie"
                    value={counts.categories}
                    icon={Folder}
                    href="/admin/categories"
                />
                <StatCard label="Zdefiniowane tagi" value={counts.tags} icon={Hash} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-11">
                <OverviewPanel
                    id="overview-featured-works"
                    title="Prace wyróżnione na stronie głównej"
                >
                    <FeaturedWorks cards={bento.desktop} />
                </OverviewPanel>
                <OverviewPanel id="overview-social-links" title="Linki społecznościowe">
                    <SocialLinks links={links} />
                </OverviewPanel>
            </div>
        </>
    )
}
