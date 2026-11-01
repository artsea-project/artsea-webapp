import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

interface WorksPaginationProps {
    page: number
    pageCount: number
    search: string
}

function buildPageHref(page: number, search: string): string {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (page > 1) params.set("page", String(page))
    const queryString = params.toString()
    return queryString ? `/admin/works?${queryString}` : "/admin/works"
}

export function getVisiblePages(page: number, pageCount: number): number[] {
    const maxButtons = 5
    if (pageCount <= maxButtons) {
        return Array.from({ length: pageCount }, (_, index) => index + 1)
    }

    const half = Math.floor(maxButtons / 2)
    const start = Math.max(1, Math.min(page - half, pageCount - maxButtons + 1))
    return Array.from({ length: maxButtons }, (_, index) => start + index)
}

export default function WorksPagination({ page, pageCount, search }: WorksPaginationProps) {
    if (pageCount <= 1) return null

    const pages = getVisiblePages(page, pageCount)
    const hasPrevious = page > 1
    const hasNext = page < pageCount

    const itemBase =
        "inline-flex size-9 items-center justify-center rounded-lg border text-xs font-medium transition-colors"

    return (
        <nav aria-label="Paginacja prac" className="flex items-center justify-center gap-2 pt-2">
            {hasPrevious ? (
                <Link
                    href={buildPageHref(page - 1, search)}
                    aria-label="Poprzednia strona"
                    className={cn(
                        itemBase,
                        "border-border bg-background text-foreground hover:bg-muted"
                    )}
                >
                    <ChevronLeft className="size-4" />
                </Link>
            ) : (
                <span
                    aria-disabled="true"
                    className={cn(
                        itemBase,
                        "border-border bg-background text-muted-foreground opacity-40"
                    )}
                >
                    <ChevronLeft className="size-4" />
                </span>
            )}

            {pages.map((pageNumber) => {
                const isActive = pageNumber === page
                return (
                    <Link
                        key={pageNumber}
                        href={buildPageHref(pageNumber, search)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            itemBase,
                            isActive
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-background text-foreground hover:bg-muted"
                        )}
                    >
                        {pageNumber}
                    </Link>
                )
            })}

            {hasNext ? (
                <Link
                    href={buildPageHref(page + 1, search)}
                    aria-label="Następna strona"
                    className={cn(
                        itemBase,
                        "border-border bg-background text-foreground hover:bg-muted"
                    )}
                >
                    <ChevronRight className="size-4" />
                </Link>
            ) : (
                <span
                    aria-disabled="true"
                    className={cn(
                        itemBase,
                        "border-border bg-background text-muted-foreground opacity-40"
                    )}
                >
                    <ChevronRight className="size-4" />
                </span>
            )}
        </nav>
    )
}
