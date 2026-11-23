import { Suspense } from "react"

import CategoriesSection from "@/components/admin-categories/CategoriesSection"
import TagsSection from "@/components/admin-categories/TagsSection"
import { requireArtistSession } from "@/lib/auth/session"
import { getCategoriesWithWorkCounts, getOrderedTags } from "@/lib/categories/queries"

export const instant = false

export default function AdminCategoriesPage() {
    return (
        <Suspense fallback={null}>
            <CategoriesContent />
        </Suspense>
    )
}

async function CategoriesContent() {
    await requireArtistSession()

    const [categories, tags] = await Promise.all([getCategoriesWithWorkCounts(), getOrderedTags()])

    return (
        <div className="px-4 py-6 font-secondary sm:px-8 md:px-16 md:py-9">
            <div className="flex w-full flex-col gap-10">
                <CategoriesSection categories={categories} />
                <TagsSection tags={tags} />
            </div>
        </div>
    )
}
