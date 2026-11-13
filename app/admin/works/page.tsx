import { Suspense } from "react"

import WorksSection from "@/components/admin-works/WorksSection"
import { getAdminWorks, getWorkCategories } from "@/lib/works/queries"
import { normalizeSearchQuery, parseCategoryFilter, parsePage } from "@/lib/works/validation"

interface AdminWorksPageProps {
    searchParams: Promise<{
        q?: string | string[]
        category?: string | string[]
        page?: string | string[]
    }>
}

export default function AdminWorksPage({ searchParams }: AdminWorksPageProps) {
    return (
        <Suspense fallback={null}>
            <WorksContent searchParams={searchParams} />
        </Suspense>
    )
}

async function WorksContent({ searchParams }: AdminWorksPageProps) {
    const resolved = await searchParams
    const search = normalizeSearchQuery(resolved.q)
    const categoryId = parseCategoryFilter(resolved.category)
    const requestedPage = parsePage(resolved.page)
    const [{ works, page, pageCount }, categories] = await Promise.all([
        getAdminWorks({ search, categoryId, page: requestedPage }),
        getWorkCategories(),
    ])

    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <WorksSection
                works={works}
                categories={categories}
                page={page}
                pageCount={pageCount}
                search={search}
                selectedCategoryId={categoryId}
            />
        </div>
    )
}
