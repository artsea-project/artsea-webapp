import { Suspense } from "react"

import WorksSection from "@/components/admin-works/WorksSection"
import { getAdminWorks } from "@/lib/works/queries"
import { normalizeSearchQuery, parsePage, parseVisibilityFilter } from "@/lib/works/validation"

interface AdminWorksPageProps {
    searchParams: Promise<{
        q?: string | string[]
        hidden?: string | string[]
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
    const onlyHidden = parseVisibilityFilter(resolved.hidden)
    const requestedPage = parsePage(resolved.page)
    const { works, page, pageCount } = await getAdminWorks({
        search,
        onlyHidden,
        page: requestedPage,
    })

    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <WorksSection
                works={works}
                page={page}
                pageCount={pageCount}
                search={search}
                onlyHidden={onlyHidden}
            />
        </div>
    )
}
