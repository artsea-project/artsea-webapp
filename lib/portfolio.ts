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
