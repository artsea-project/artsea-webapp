import { Folder, Hash, Image as ImageIcon } from "lucide-react"
import { Suspense } from "react"

import BentoPreviewCard from "@/components/admin-overview/BentoPreviewCard"
import OverviewStatCard from "@/components/admin-overview/OverviewStatCard"
import SocialLinksCard from "@/components/admin-overview/SocialLinksCard"
import { getAdminOverviewData } from "@/lib/overview/queries"

export default function AdminOverviewPage() {
    return (
        <Suspense fallback={null}>
            <OverviewContent />
        </Suspense>
    )
}

async function OverviewContent() {
    const data = await getAdminOverviewData()

    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex w-full flex-col gap-9">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Przegląd zawartości</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Podsumowanie dodanych elementów, zarządzanie kategoriami i tagami.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <OverviewStatCard
                        label="Dodane prace"
                        value={data.worksCount}
                        href="/admin/works"
                        icon={ImageIcon}
                    />
                    <OverviewStatCard
                        label="Aktywne kategorie"
                        value={data.categoriesCount}
                        href="/admin/categories"
                        icon={Folder}
                    />
                    <OverviewStatCard
                        label="Zdefiniowane tagi"
                        value={data.tagsCount}
                        href="/admin/categories"
                        icon={Hash}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-11">
                    <section className="flex flex-col gap-5">
                        <h3 className="text-sm font-normal text-muted-foreground">
                            Prace wyróżnione na stronie głównej.
                        </h3>
                        <BentoPreviewCard works={data.featuredWorks} />
                    </section>

                    <section className="flex flex-col gap-5">
                        <h3 className="text-sm font-normal text-muted-foreground">
                            Linki społecznościowe
                        </h3>
                        <SocialLinksCard links={data.links} />
                    </section>
                </div>
            </div>
        </div>
    )
}
