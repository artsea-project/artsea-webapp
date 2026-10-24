import { orderBentoLabels } from "@/lib/localized-labels"
import type { MediaType } from "@/lib/media"
import type { MediaDimensions } from "@/lib/media-dimensions"

export const PORTFOLIO_PATH = "/portfolio"
export const PORTFOLIO_PAGE_SIZE = 12
export const PORTFOLIO_CARD_TEXT_HEIGHT = 0.18

export type PortfolioArtwork = {
    artPieceId: string
    title: string
    year: number | null
    uploadedAt: Date
    category: string
    tags: string[]
    cover: { mediaId: string; fileType: MediaType; contentHash: string }
}

export type PortfolioCard = PortfolioArtwork & MediaDimensions

export type RawSearchParams = Record<string, string | string[] | undefined>

export type PortfolioQuery = { category: string | null; tags: string[]; page: number }

export type PortfolioView = {
    categories: string[]
    tags: string[]
    query: PortfolioQuery
    items: PortfolioArtwork[]
    hasMore: boolean
}

export type TagsByCategory = Map<string, Set<string>>

function keepOnlyKnown(values: string[], known: string[]) {
    return known.filter((label) => values.includes(label))
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

export function removeDuplicatesAndSort(labels: string[]) {
    return orderBentoLabels([...new Set(labels)])
}

function keepIfKnown(value: string | null, known: string[]) {
    return value !== null && known.includes(value) ? value : null
}

function filterByCategory(artworks: PortfolioArtwork[], category: string | null) {
    if (category === null) return artworks
    return artworks.filter((artwork) => artwork.category === category)
}

function keepArtworksWithAllTags(artworks: PortfolioArtwork[], tags: string[]) {
    return artworks.filter((artwork) => tags.every((tag) => artwork.tags.includes(tag)))
}

function limitArtworksToLoadedPage(artworks: PortfolioArtwork[], requestedPage: number) {
    const lastPage = Math.max(1, Math.ceil(artworks.length / PORTFOLIO_PAGE_SIZE))
    const page = Math.min(requestedPage, lastPage)
    const items = artworks.slice(0, page * PORTFOLIO_PAGE_SIZE)
    return { page, items, hasMore: artworks.length > items.length }
}

export function buildPortfolioView(
    artworks: PortfolioArtwork[],
    requested: PortfolioQuery
): PortfolioView {
    const categories = removeDuplicatesAndSort(artworks.map((artwork) => artwork.category))
    const category = keepIfKnown(requested.category, categories)

    const inCategory = filterByCategory(artworks, category)
    const tags = removeDuplicatesAndSort(inCategory.flatMap((artwork) => artwork.tags))
    const selectedTags = keepOnlyKnown(requested.tags, tags)

    const matching = sortArtworksNewestFirst(keepArtworksWithAllTags(inCategory, selectedTags))
    const { page, items, hasMore } = limitArtworksToLoadedPage(matching, requested.page)

    return { categories, tags, query: { category, tags: selectedTags, page }, items, hasMore }
}

export function buildPortfolioUrl(query: PortfolioQuery) {
    const params = new URLSearchParams()
    if (query.category) params.set("category", query.category)
    query.tags.forEach((tag) => params.append("tag", tag))
    if (query.page > 1) params.set("page", String(query.page))
    const search = params.toString()
    return search ? `${PORTFOLIO_PATH}?${search}` : PORTFOLIO_PATH
}

export function collectTagsByCategory(artworks: PortfolioArtwork[]): TagsByCategory {
    const tagsByCategory: TagsByCategory = new Map()
    for (const artwork of artworks) {
        const tags = tagsByCategory.get(artwork.category) ?? new Set<string>()
        artwork.tags.forEach((tag) => tags.add(tag))
        tagsByCategory.set(artwork.category, tags)
    }
    return tagsByCategory
}

export function keepTagsUsedInCategory(
    category: string | null,
    tags: string[],
    tagsByCategory: TagsByCategory
) {
    if (category === null) return tags
    const tagsInCategory = tagsByCategory.get(category)
    return tags.filter((tag) => tagsInCategory?.has(tag))
}

export function addOrRemoveTag(selectedTags: string[], tag: string) {
    return selectedTags.includes(tag)
        ? selectedTags.filter((selected) => selected !== tag)
        : [...selectedTags, tag]
}

// Selected tags go first and are never hidden, even when there are more of them than the limit
export function splitIntoVisibleAndHiddenTags(
    tags: string[],
    selectedTags: string[],
    visibleCount: number
) {
    const unselected = tags.filter((tag) => !selectedTags.includes(tag))
    const unselectedVisibleCount = Math.max(0, visibleCount - selectedTags.length)
    return {
        visible: [...selectedTags, ...unselected.slice(0, unselectedVisibleCount)],
        hidden: unselected.slice(unselectedVisibleCount),
    }
}

// Earlier cards don't move when more cards are appended.
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
