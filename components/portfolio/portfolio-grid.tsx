import { PortfolioCard } from "@/components/portfolio/portfolio-card"
import type { PortfolioArtwork } from "@/lib/portfolio"

const CARD_SIZES = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"

export function PortfolioGrid({ artworks }: { artworks: PortfolioArtwork[] }) {
    return (
        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-x-[60px] lg:gap-y-14">
            {artworks.map((artwork) => (
                <PortfolioCard key={artwork.artPieceId} artwork={artwork} sizes={CARD_SIZES} />
            ))}
        </div>
    )
}
