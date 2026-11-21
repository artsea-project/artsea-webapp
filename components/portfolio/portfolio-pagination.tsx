import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { buildPortfolioUrl, listPageLinks, type PortfolioQuery } from "@/lib/portfolio"

type PortfolioPaginationProps = {
    query: PortfolioQuery
    pageCount: number
}

export function PortfolioPagination({ query, pageCount }: PortfolioPaginationProps) {
    const hrefFor = (page: number) => buildPortfolioUrl({ ...query, page })

    return (
        <Pagination className="mt-16 font-secondary lg:mt-28">
            <PaginationContent>
                {query.page > 1 && (
                    <PaginationItem>
                        <PaginationPrevious href={hrefFor(query.page - 1)} />
                    </PaginationItem>
                )}
                {listPageLinks(query.page, pageCount).map((link, index) => (
                    <PaginationItem key={link === "ellipsis" ? `ellipsis-${index}` : link}>
                        {link === "ellipsis" ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink href={hrefFor(link)} isActive={link === query.page}>
                                {link}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}
                {query.page < pageCount && (
                    <PaginationItem>
                        <PaginationNext href={hrefFor(query.page + 1)} />
                    </PaginationItem>
                )}
            </PaginationContent>
        </Pagination>
    )
}
