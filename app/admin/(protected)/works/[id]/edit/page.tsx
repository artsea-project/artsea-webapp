import { notFound } from "next/navigation"
import { Suspense } from "react"

import WorkForm from "@/components/admin-works/WorkForm"
import { getWorkForEdit, getWorkFormOptions } from "@/lib/works/queries"

interface AdminEditWorkPageProps {
    params: Promise<{ id: string }>
}

export default function AdminEditWorkPage({ params }: AdminEditWorkPageProps) {
    return (
        <Suspense fallback={null}>
            <EditWorkContent params={params} />
        </Suspense>
    )
}

async function EditWorkContent({ params }: AdminEditWorkPageProps) {
    const { id } = await params
    const [work, { categories, tags }] = await Promise.all([
        getWorkForEdit(id),
        getWorkFormOptions(),
    ])

    if (!work) notFound()

    return (
        <div data-leave-guard-root className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <WorkForm work={work} categories={categories} tags={tags} />
        </div>
    )
}
