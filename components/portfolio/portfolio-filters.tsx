import Link from "next/link"

import { TagPills, type TagLink } from "@/components/portfolio/tag-pill"
import {
    addOrRemoveTag,
    buildPortfolioUrl,
    keepTagsUsedInCategory,
    type PortfolioQuery,
    type PortfolioView,
    type TagsByCategory,
} from "@/lib/portfolio"
import { cn } from "@/lib/utils"

type FilterView = Pick<PortfolioView, "categories" | "tags" | "query">

type PortfolioFiltersProps = {
    view: FilterView
    tagsByCategory: TagsByCategory
}

const ALL_CATEGORIES_LABEL = "Wszystkie"

function buildCategoryTabUrl(
    category: string | null,
    query: PortfolioQuery,
    tagsByCategory: TagsByCategory
) {
    return buildPortfolioUrl({
        category,
        tags: keepTagsUsedInCategory(category, query.tags, tagsByCategory),
        page: 1,
    })
}

function buildTagLinks(tags: string[], query: PortfolioQuery): TagLink[] {
    return tags.map((tag) => ({
        tag,
        href: buildPortfolioUrl({ ...query, tags: addOrRemoveTag(query.tags, tag), page: 1 }),
        isSelected: query.tags.includes(tag),
    }))
}

type CategoryTabProps = {
    label: string
    href: string
    isActive: boolean
}

function CategoryTab({ label, href, isActive }: CategoryTabProps) {
    return (
        <Link
            href={href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "border-b pb-2 font-secondary text-sm whitespace-nowrap uppercase transition-colors",
                isActive
                    ? "border-stone-800 text-stone-800"
                    : "border-transparent text-stone-400 hover:text-stone-800"
            )}
        >
            {label}
        </Link>
    )
}

function CategoryTabs({ view, tagsByCategory }: PortfolioFiltersProps) {
    const tabs = [
        { label: ALL_CATEGORIES_LABEL, category: null },
        ...view.categories.map((category) => ({ label: category, category })),
    ]

    return (
        <nav aria-label="Kategorie" className="flex flex-wrap gap-x-8 gap-y-3 lg:gap-x-10">
            {tabs.map(({ label, category }) => (
                <CategoryTab
                    key={category ?? ""}
                    label={label}
                    href={buildCategoryTabUrl(category, view.query, tagsByCategory)}
                    isActive={category === view.query.category}
                />
            ))}
        </nav>
    )
}

export function PortfolioFilters({ view, tagsByCategory }: PortfolioFiltersProps) {
    return (
        <div className="mt-8 flex flex-col gap-6 sm:mt-10 lg:gap-9">
            <CategoryTabs view={view} tagsByCategory={tagsByCategory} />
            {view.tags.length > 0 && (
                <nav aria-label="Tagi" className="flex flex-wrap gap-2.5">
                    <TagPills links={buildTagLinks(view.tags, view.query)} />
                </nav>
            )}
        </div>
    )
}
