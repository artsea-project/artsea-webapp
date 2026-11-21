import type { Locale } from "@/i18n/routing"
import type { MediaType } from "@/lib/media"
import type { MediaDimensions } from "@/lib/media-dimensions"

export const PORTFOLIO_PATH = "/portfolio"
export const PORTFOLIO_PAGE_SIZE = 12
export const PORTFOLIO_CARD_TEXT_HEIGHT = 0.18

export type PortfolioLabel = { id: string; name: string }

export type PortfolioArtwork = {
    artPieceId: string
    title: string | null
    year: number | null
    uploadedAt: Date
    category: PortfolioLabel
    tags: PortfolioLabel[]
    cover: { mediaId: string; fileType: MediaType; contentHash: string }
}

export type PortfolioCard = PortfolioArtwork & MediaDimensions

export type RawSearchParams = Record<string, string | string[] | undefined>

export type PortfolioQuery = { category: string | null; tags: string[]; page: number }

export type PortfolioView = {
    categories: PortfolioLabel[]
    tags: PortfolioLabel[]
    query: PortfolioQuery
    items: PortfolioArtwork[]
    pageCount: number
}

export type TagsByCategory = Map<string, Set<string>>

function keepOnlyKnown(ids: string[], known: PortfolioLabel[]) {
    return known.filter((label) => ids.includes(label.id)).map((label) => label.id)
}

function readSingleParam(params: RawSearchParams, name: string): string | null {
    const value = params[name]
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed || null
}

function readParamValues(params: RawSearchParams, name: string): string[] {
    const value = params[name] ?? []
    const values = Array.isArray(value) ? value : [value]
    const trimmed = values.map((item) => item.trim()).filter(Boolean)
    return [...new Set(trimmed)]
}

function parsePageNumber(params: RawSearchParams): number {
    const value = readSingleParam(params, "page")
    if (!value || !/^\d+$/.test(value)) return 1
    const page = Number(value)
    return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

export function parsePortfolioQuery(params: RawSearchParams): PortfolioQuery {
    return {
        category: readSingleParam(params, "category"),
        tags: readParamValues(params, "tag"),
        page: parsePageNumber(params),
    }
}

function compareYearNewestFirst(left: PortfolioArtwork, right: PortfolioArtwork) {
    if (left.year === right.year) return 0
    if (left.year === null) return 1
    if (right.year === null) return -1
    return right.year - left.year
}

function compareUploadedNewestFirst(left: PortfolioArtwork, right: PortfolioArtwork) {
    return right.uploadedAt.getTime() - left.uploadedAt.getTime()
}

function compareIdAscending(left: PortfolioArtwork, right: PortfolioArtwork) {
    return left.artPieceId.localeCompare(right.artPieceId)
}

export function sortArtworksNewestFirst(artworks: PortfolioArtwork[]) {
    return [...artworks].sort(
        (left, right) =>
            compareYearNewestFirst(left, right) ||
            compareUploadedNewestFirst(left, right) ||
            compareIdAscending(left, right)
    )
}

export function removeDuplicatesAndSort(labels: PortfolioLabel[], locale: Locale) {
    const byId = new Map(labels.map((label) => [label.id, label]))
    return [...byId.values()].sort(
        (left, right) =>
            left.name.localeCompare(right.name, locale) || left.id.localeCompare(right.id)
    )
}

function keepIfKnown(id: string | null, known: PortfolioLabel[]) {
    return id !== null && known.some((label) => label.id === id) ? id : null
}

function filterByCategory(artworks: PortfolioArtwork[], categoryId: string | null) {
    if (categoryId === null) return artworks
    return artworks.filter((artwork) => artwork.category.id === categoryId)
}

function keepArtworksWithAllTags(artworks: PortfolioArtwork[], tagIds: string[]) {
    return artworks.filter((artwork) =>
        tagIds.every((tagId) => artwork.tags.some((tag) => tag.id === tagId))
    )
}

function takeArtworksOnPage(artworks: PortfolioArtwork[], requestedPage: number) {
    const pageCount = Math.max(1, Math.ceil(artworks.length / PORTFOLIO_PAGE_SIZE))
    const page = Math.min(requestedPage, pageCount)
    const start = (page - 1) * PORTFOLIO_PAGE_SIZE
    const items = artworks.slice(start, start + PORTFOLIO_PAGE_SIZE)
    return { page, items, pageCount }
}

export function buildPortfolioView(
    artworks: PortfolioArtwork[],
    requested: PortfolioQuery,
    locale: Locale
): PortfolioView {
    const categories = removeDuplicatesAndSort(
        artworks.map((artwork) => artwork.category),
        locale
    )
    const category = keepIfKnown(requested.category, categories)

    const inCategory = filterByCategory(artworks, category)
    const tags = removeDuplicatesAndSort(
        inCategory.flatMap((artwork) => artwork.tags),
        locale
    )
    const selectedTags = keepOnlyKnown(requested.tags, tags)

    const matching = sortArtworksNewestFirst(keepArtworksWithAllTags(inCategory, selectedTags))
    const { page, items, pageCount } = takeArtworksOnPage(matching, requested.page)

    return { categories, tags, query: { category, tags: selectedTags, page }, items, pageCount }
}

export function buildPortfolioUrl(query: PortfolioQuery) {
    const params = new URLSearchParams()
    if (query.category) params.set("category", query.category)
    query.tags.forEach((tag) => params.append("tag", tag))
    if (query.page > 1) params.set("page", String(query.page))
    const search = params.toString()
    return search ? `${PORTFOLIO_PATH}?${search}` : PORTFOLIO_PATH
}

export type PageLink = number | "ellipsis"

export function listPageLinks(page: number, pageCount: number): PageLink[] {
    const shown = [1, page - 1, page, page + 1, pageCount].filter(
        (number) => number >= 1 && number <= pageCount
    )
    const numbers = [...new Set(shown)].sort((left, right) => left - right)

    return numbers.flatMap((number, index): PageLink[] => {
        const previous = numbers[index - 1]
        if (previous === undefined || number - previous === 1) return [number]
        if (number - previous === 2) return [previous + 1, number]
        return ["ellipsis", number]
    })
}

export function collectTagsByCategory(artworks: PortfolioArtwork[]): TagsByCategory {
    const tagsByCategory: TagsByCategory = new Map()
    for (const artwork of artworks) {
        const tagIds = tagsByCategory.get(artwork.category.id) ?? new Set<string>()
        artwork.tags.forEach((tag) => tagIds.add(tag.id))
        tagsByCategory.set(artwork.category.id, tagIds)
    }
    return tagsByCategory
}

export function keepTagsUsedInCategory(
    categoryId: string | null,
    tagIds: string[],
    tagsByCategory: TagsByCategory
) {
    if (categoryId === null) return tagIds
    const tagsInCategory = tagsByCategory.get(categoryId)
    return tagIds.filter((tagId) => tagsInCategory?.has(tagId))
}

export function addOrRemoveTag(selectedTagIds: string[], tagId: string) {
    return selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((selected) => selected !== tagId)
        : [...selectedTagIds, tagId]
}

// Selected tags go first and are never hidden, even when there are more of them than the limit
export function splitIntoVisibleAndHiddenTags(
    tags: PortfolioLabel[],
    selectedTagIds: string[],
    visibleCount: number
) {
    const selected = selectedTagIds.flatMap((id) => tags.filter((tag) => tag.id === id))
    const unselected = tags.filter((tag) => !selectedTagIds.includes(tag.id))
    const unselectedVisibleCount = Math.max(0, visibleCount - selected.length)
    return {
        visible: [...selected, ...unselected.slice(0, unselectedVisibleCount)],
        hidden: unselected.slice(unselectedVisibleCount),
    }
}

export function distributeIntoColumns<T extends MediaDimensions>(items: T[], columnCount: number) {
    const count = Math.max(1, Math.floor(columnCount))
    const columns: T[][] = Array.from({ length: count }, () => [])
    const heights = Array<number>(count).fill(0)

    for (const item of items) {
        const shortest = heights.indexOf(Math.min(...heights))
        columns[shortest].push(item)
        heights[shortest] += item.height / item.width + PORTFOLIO_CARD_TEXT_HEIGHT
    }

    return columns
}
