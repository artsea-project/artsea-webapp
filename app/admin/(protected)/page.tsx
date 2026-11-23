import { Suspense } from "react"
import { Folder, Hash, Image as ImageIcon } from "lucide-react"

import FeaturedWorks from "@/components/admin-overview/FeaturedWorks"
import OverviewPanel from "@/components/admin-overview/OverviewPanel"
import SocialLinks from "@/components/admin-overview/SocialLinks"
import StatCard from "@/components/admin-overview/StatCard"
import AdminPageIntro from "@/components/AdminPageIntro"
import { requireArtistSession } from "@/lib/auth/session"
import { getBentoData } from "@/lib/bento"
import { describeHiddenWorks } from "@/lib/overview/hidden-works"
import { getOverviewCounts } from "@/lib/overview/queries"
import { getOrderedLinks } from "@/lib/profile/queries"

export const instant = false

const FEATURED_WORKS_PANEL = {
    id: "overview-featured-works",
    title: "Prace wyróżnione na stronie głównej",
}

export default function AdminOverviewPage() {
    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex w-full flex-col gap-8">
                <AdminPageIntro
                    title="Przegląd zawartości"
                    description="Podsumowanie prac, kategorii i tagów oraz tego, co widać na stronie głównej."
                />
                <Suspense fallback={null}>
                    <OverviewCounts />
                </Suspense>
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-11">
                    <Suspense fallback={<OverviewPanel {...FEATURED_WORKS_PANEL} />}>
                        <OverviewFeaturedWorks />
                    </Suspense>
                    <OverviewPanel id="overview-social-links" title="Linki społecznościowe">
                        <Suspense fallback={null}>
                            <OverviewSocialLinks />
                        </Suspense>
                    </OverviewPanel>
                </div>
            </div>
        </div>
    )
}

async function OverviewCounts() {
    await requireArtistSession()
    const counts = await getOverviewCounts()

    return (
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
            <StatCard
                label="Zdefiniowane tagi"
                value={counts.tags}
                icon={Hash}
                href="/admin/categories"
            />
        </div>
    )
}

async function OverviewFeaturedWorks() {
    await requireArtistSession()
    const bento = await getBentoData("pl")

    return <FeaturedWorks {...FEATURED_WORKS_PANEL} data={bento} />
}

async function OverviewSocialLinks() {
    await requireArtistSession()
    const links = await getOrderedLinks()

    return <SocialLinks links={links} />
}
