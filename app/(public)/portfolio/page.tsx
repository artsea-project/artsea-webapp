import type { Metadata } from "next"
import { Suspense } from "react"

import { loadPortfolioArtworks } from "@/lib/portfolio-data"

export const metadata: Metadata = { title: "Moje prace" }

async function PortfolioContent() {
    const artworks = await loadPortfolioArtworks()
    return (
        <ul>
            {artworks.map((artwork) => (
                <li key={artwork.artPieceId}>{artwork.title}</li>
            ))}
        </ul>
    )
}

export default function PortfolioPage() {
    return (
        <div className="bg-white px-5 py-12 text-stone-950 sm:px-8 sm:py-16 lg:px-12 lg:py-24">
            <section aria-labelledby="portfolio-heading" className="mx-auto w-full max-w-[1200px]">
                <h1
                    id="portfolio-heading"
                    className="mb-8 font-primary text-4xl leading-none tracking-[-0.03em] sm:mb-10 sm:text-5xl lg:text-[56px]"
                >
                    Moje prace.
                </h1>
                <Suspense fallback={null}>
                    <PortfolioContent />
                </Suspense>
            </section>
        </div>
    )
}
