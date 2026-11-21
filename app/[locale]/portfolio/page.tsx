import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { NoMatchingArtworks } from "@/components/portfolio/no-matching-artworks"
import { PortfolioFilters } from "@/components/portfolio/portfolio-filters"
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid"
import { PortfolioPagination } from "@/components/portfolio/portfolio-pagination"
import type { RawSearchParams } from "@/lib/portfolio"
import { getPortfolioPage } from "@/lib/portfolio-data"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Portfolio")
    return { title: t("title") }
}

type PortfolioPageProps = {
    searchParams: Promise<RawSearchParams>
}

async function PortfolioContent({ searchParams }: PortfolioPageProps) {
    const t = await getTranslations("Portfolio")
    const page = await getPortfolioPage(await searchParams, await getLocale())

    if (page.categories.length === 0) {
        return <p className="mt-8 font-body text-muted-foreground sm:mt-10">{t("empty")}</p>
    }

    return (
        <>
            <PortfolioFilters view={page} tagsByCategory={page.tagsByCategory} />
            {page.cards.length === 0 ? (
                <NoMatchingArtworks />
            ) : (
                <PortfolioGrid cards={page.cards} />
            )}
            {page.pageCount > 1 && (
                <PortfolioPagination query={page.query} pageCount={page.pageCount} />
            )}
        </>
    )
}

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
    const t = await getTranslations("Portfolio")

    return (
        <div className="bg-background px-5 py-12 text-foreground sm:px-8 sm:py-16 lg:px-12 lg:py-24">
            <section aria-labelledby="portfolio-heading" className="mx-auto w-full max-w-[1200px]">
                <h1
                    id="portfolio-heading"
                    className="mb-8 font-primary text-4xl leading-none tracking-[-0.03em] sm:mb-10 sm:text-5xl lg:text-[56px]"
                >
                    {t("heading")}
                </h1>
                <Suspense fallback={null}>
                    <PortfolioContent searchParams={searchParams} />
                </Suspense>
            </section>
        </div>
    )
}
