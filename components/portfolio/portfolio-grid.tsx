import { PortfolioCard } from "@/components/portfolio/portfolio-card"
import { distributeIntoColumns, type PortfolioCard as PortfolioCardData } from "@/lib/portfolio"
import { cn } from "@/lib/utils"

const LAYOUTS = [
    { columns: 1, className: "flex md:hidden", sizes: "100vw" },
    { columns: 2, className: "hidden md:flex lg:hidden", sizes: "50vw" },
    { columns: 3, className: "hidden lg:flex", sizes: "360px" },
] as const

export function PortfolioGrid({ cards }: { cards: PortfolioCardData[] }) {
    return (
        <div className="mt-10 lg:mt-14">
            {LAYOUTS.map((layout) => (
                <div
                    key={layout.columns}
                    className={cn(layout.className, "items-start gap-8 lg:gap-[60px]")}
                >
                    {distributeIntoColumns(cards, layout.columns).map((column, index) => (
                        <div key={index} className="flex min-w-0 flex-1 flex-col gap-12 lg:gap-14">
                            {column.map((card) => (
                                <PortfolioCard
                                    key={card.artPieceId}
                                    card={card}
                                    sizes={layout.sizes}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}
