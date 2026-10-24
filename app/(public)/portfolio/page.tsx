import type { Metadata } from "next"
import { Suspense } from "react"

import { LoadMoreLink } from "@/components/portfolio/load-more-link"
import { PortfolioFilters } from "@/components/portfolio/portfolio-filters"
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid"
import type { RawSearchParams } from "@/lib/portfolio"
import { getPortfolioPage } from "@/lib/portfolio-data"

export const metadata: Metadata = { title: "Moje prace" }

type PortfolioPageProps = {
    searchParams: Promise<RawSearchParams>
}

async function PortfolioContent({ searchParams }: PortfolioPageProps) {
    const page = await getPortfolioPage(await searchParams)

    if (page.categories.length === 0) {
        return (
            <p className="mt-8 font-body text-stone-500 sm:mt-10">
                Nie ma jeszcze żadnych prac do pokazania.
            </p>
        )
    }

    return (
        <>
            <PortfolioFilters view={page} tagsByCategory={page.tagsByCategory} />
            <PortfolioGrid artworks={page.cards} />
            {page.hasMore && <LoadMoreLink query={page.query} />}
        </>
    )
}

export default function PortfolioPage({ searchParams }: PortfolioPageProps) {
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
                    <PortfolioContent searchParams={searchParams} />
                </Suspense>
            </section>
        </div>
    )
}
