import Image from "next/image"
import Link from "next/link"

import { PortfolioGif } from "@/components/portfolio/portfolio-gif"
import { PortfolioVideo } from "@/components/portfolio/portfolio-video"
import type { PortfolioCard as PortfolioCardData } from "@/lib/portfolio"

type PortfolioCardProps = {
    card: PortfolioCardData
    sizes: string
}

function CardMedia({ card, sizes }: PortfolioCardProps) {
    const { mediaId, fileType } = card.cover

    if (fileType === "mp4") return <PortfolioVideo mediaId={mediaId} title={card.title} />
    if (fileType === "gif") {
        return (
            <PortfolioGif
                mediaId={mediaId}
                title={card.title}
                width={card.width}
                height={card.height}
                sizes={sizes}
            />
        )
    }
    return (
        <Image
            src={`/media/${mediaId}`}
            alt={card.title}
            width={card.width}
            height={card.height}
            sizes={sizes}
            className="h-full w-full object-contain"
        />
    )
}

export function PortfolioCard({ card, sizes }: PortfolioCardProps) {
    const tags = card.tags.map((tag) => `#${tag}`).join("  ")

    return (
        <article>
            <Link
                href={`/work/${card.artPieceId}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
                <div
                    className="w-full overflow-hidden bg-muted"
                    style={{ aspectRatio: `${card.width} / ${card.height}` }}
                >
                    <CardMedia card={card} sizes={sizes} />
                </div>
                <h2 className="mt-4 font-primary text-xl font-bold leading-tight text-foreground group-hover:underline group-focus-visible:underline">
                    {card.title}
                </h2>
                {(card.year || tags) && (
                    <p className="mt-1.5 font-secondary text-xs whitespace-pre-wrap">
                        {card.year && <span className="text-muted-foreground/70">{card.year}</span>}
                        {card.year && tags && (
                            <span className="text-muted-foreground">{"  ·  "}</span>
                        )}
                        {tags && <span className="text-muted-foreground">{tags}</span>}
                    </p>
                )}
            </Link>
        </article>
    )
}
