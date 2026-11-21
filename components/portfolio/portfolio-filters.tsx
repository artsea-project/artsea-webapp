import { useTranslations } from "next-intl"

import { CollapsibleTagList } from "@/components/portfolio/collapsible-tag-list"
import { TagDrawer } from "@/components/portfolio/tag-drawer"
import { TagPills, type TagLink } from "@/components/portfolio/tag-pill"
import { Link } from "@/i18n/navigation"
import {
    addOrRemoveTag,
    buildPortfolioUrl,
    keepTagsUsedInCategory,
    splitIntoVisibleAndHiddenTags,
    type PortfolioLabel,
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

const VISIBLE_TAG_COUNT = 10

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

function buildTagLinks(tags: PortfolioLabel[], query: PortfolioQuery): TagLink[] {
    return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        href: buildPortfolioUrl({ ...query, tags: addOrRemoveTag(query.tags, tag.id), page: 1 }),
        isSelected: query.tags.includes(tag.id),
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
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
            )}
        >
            {label}
        </Link>
    )
}

function CategoryTabs({ view, tagsByCategory }: PortfolioFiltersProps) {
    const t = useTranslations("Portfolio")
    const tabs = [
        { label: t("allCategories"), category: null },
        ...view.categories.map(({ id, name }) => ({ label: name, category: id })),
    ]

    return (
        <nav aria-label={t("categories")} className="flex flex-wrap gap-x-8 gap-y-3 lg:gap-x-10">
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

function selectedTags(view: FilterView) {
    return view.query.tags.flatMap((id) => view.tags.filter((tag) => tag.id === id))
}

function MobileTagFilters({ view }: { view: FilterView }) {
    return (
        <div className="flex flex-wrap items-center gap-2.5">
            <TagDrawer tags={view.tags} query={view.query} />
            <TagPills links={buildTagLinks(selectedTags(view), view.query)} />
        </div>
    )
}

function DesktopTagFilters({ view }: { view: FilterView }) {
    const { visible, hidden } = splitIntoVisibleAndHiddenTags(
        view.tags,
        view.query.tags,
        VISIBLE_TAG_COUNT
    )

    return (
        <CollapsibleTagList
            visible={buildTagLinks(visible, view.query)}
            hidden={buildTagLinks(hidden, view.query)}
        />
    )
}

export function PortfolioFilters({ view, tagsByCategory }: PortfolioFiltersProps) {
    return (
        <div className="mt-8 flex flex-col gap-6 sm:mt-10 lg:gap-9">
            <CategoryTabs view={view} tagsByCategory={tagsByCategory} />
            {view.tags.length > 0 && (
                <>
                    <div className="md:hidden">
                        <MobileTagFilters view={view} />
                    </div>
                    <div className="hidden md:block">
                        <DesktopTagFilters view={view} />
                    </div>
                </>
            )}
        </div>
    )
}
