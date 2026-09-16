import { Suspense } from "react"

import WorkForm from "@/components/admin-works/WorkForm"
import { getWorkFormOptions } from "@/lib/works/queries"

export default function AdminNewWorkPage() {
    return (
        <Suspense fallback={null}>
            <NewWorkContent />
        </Suspense>
    )
}

async function NewWorkContent() {
    const { categories, tags } = await getWorkFormOptions()

    return (
        <div data-leave-guard-root className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <WorkForm categories={categories} tags={tags} />
        </div>
    )
}
