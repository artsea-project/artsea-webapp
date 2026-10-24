import Image from "next/image"
import Link from "next/link"

import { bentoImageProps } from "@/components/bento/bento-card"
import type { PortfolioArtwork } from "@/lib/portfolio"

type PortfolioCardProps = {
    artwork: PortfolioArtwork
    sizes: string
}

export function PortfolioCard({ artwork, sizes }: PortfolioCardProps) {
    const tags = artwork.tags.map((tag) => `#${tag}`).join("  ")

    return (
        <article>
            <Link
                href={`/work/${artwork.artPieceId}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-800"
            >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
                    <Image
                        {...bentoImageProps(artwork.cover.mediaId, sizes)}
                        alt={artwork.title}
                        className="object-cover"
                    />
                </div>
                <h2 className="mt-4 font-primary text-xl font-bold leading-tight text-stone-800 group-hover:underline group-focus-visible:underline">
                    {artwork.title}
                </h2>
                {(artwork.year || tags) && (
                    <p className="mt-1.5 font-secondary text-xs whitespace-pre-wrap">
                        {artwork.year && <span className="text-stone-400">{artwork.year}</span>}
                        {artwork.year && tags && <span className="text-stone-500">{"  ·  "}</span>}
                        {tags && <span className="text-stone-500">{tags}</span>}
                    </p>
                )}
            </Link>
        </article>
    )
}
