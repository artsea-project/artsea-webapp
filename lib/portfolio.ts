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
