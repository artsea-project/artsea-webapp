import { orderBentoLabels } from "@/lib/localized-labels"
import type { MediaType } from "@/lib/media"

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

export type RawSearchParams = Record<string, string | string[] | undefined>

export type PortfolioQuery = { category: string | null; tag: string | null; page: number }

export type PortfolioView = {
    categories: string[]
    tags: string[]
    query: PortfolioQuery
    items: PortfolioArtwork[]
    hasMore: boolean
}

function readSingleParam(params: RawSearchParams, name: string): string | null {
    const value = params[name]
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed || null
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
        tag: readSingleParam(params, "tag"),
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

function compareId(left: PortfolioArtwork, right: PortfolioArtwork) {
    return left.artPieceId.localeCompare(right.artPieceId)
}

export function orderPortfolioArtworks(artworks: PortfolioArtwork[]) {
    return [...artworks].sort(
        (left, right) =>
            compareYearNewestFirst(left, right) ||
            compareUploadedNewestFirst(left, right) ||
            compareId(left, right)
    )
}

export function uniqueOrderedLabels(labels: string[]) {
    return orderBentoLabels([...new Set(labels)])
}

function knownOrNull(value: string | null, known: string[]) {
    return value !== null && known.includes(value) ? value : null
}

function filterByCategory(artworks: PortfolioArtwork[], category: string | null) {
    if (category === null) return artworks
    return artworks.filter((artwork) => artwork.category === category)
}

function filterByTag(artworks: PortfolioArtwork[], tag: string | null) {
    if (tag === null) return artworks
    return artworks.filter((artwork) => artwork.tags.includes(tag))
}

function takePage(artworks: PortfolioArtwork[], requestedPage: number) {
    const lastPage = Math.max(1, Math.ceil(artworks.length / PORTFOLIO_PAGE_SIZE))
    const page = Math.min(requestedPage, lastPage)
    const items = artworks.slice(0, page * PORTFOLIO_PAGE_SIZE)
    return { page, items, hasMore: artworks.length > items.length }
}

export function buildPortfolioView(
    artworks: PortfolioArtwork[],
    requested: PortfolioQuery
): PortfolioView {
    const categories = uniqueOrderedLabels(artworks.map((artwork) => artwork.category))
    const category = knownOrNull(requested.category, categories)

    const inCategory = filterByCategory(artworks, category)
    const tags = uniqueOrderedLabels(inCategory.flatMap((artwork) => artwork.tags))
    const tag = knownOrNull(requested.tag, tags)

    const matching = orderPortfolioArtworks(filterByTag(inCategory, tag))
    const { page, items, hasMore } = takePage(matching, requested.page)

    return { categories, tags, query: { category, tag, page }, items, hasMore }
}
