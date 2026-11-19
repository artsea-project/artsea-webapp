import { Suspense } from "react"
import { Image as ImageIcon } from "lucide-react"

import StatCard from "@/components/admin-overview/StatCard"
import AdminPageIntro from "@/components/AdminPageIntro"
import { getOverviewCounts } from "@/lib/overview/queries"

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
    const counts = await getOverviewCounts()

    return (
        <div className="grid gap-6 sm:grid-cols-3">
            <StatCard
                label="Dodane prace"
                value={counts.works}
                icon={ImageIcon}
                href="/admin/works"
            />
        </div>
    )
}
