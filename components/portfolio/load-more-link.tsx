import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildPortfolioUrl, type PortfolioQuery } from "@/lib/portfolio"

export function LoadMoreLink({ query }: { query: PortfolioQuery }) {
    return (
        <div className="mt-16 flex justify-center lg:mt-28">
            <Button
                asChild
                variant="outline"
                className="h-12 w-[200px] gap-3 rounded-full border-foreground bg-transparent font-secondary text-[13px] font-normal uppercase text-foreground shadow-none hover:bg-muted hover:text-foreground"
            >
                <Link
                    href={buildPortfolioUrl({ ...query, page: query.page + 1 })}
                    replace
                    scroll={false}
                >
                    Załaduj więcej
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                </Link>
            </Button>
        </div>
    )
}
