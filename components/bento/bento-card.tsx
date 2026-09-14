import Image from "next/image"

import type { BentoCardData } from "@/lib/bento"

type BentoCardProps = {
    card: BentoCardData
    className: string
    sizes: string
}

export function BentoCard({ card, className, sizes }: BentoCardProps) {
    const visibleTags = card.tags.slice(0, 3)
    const hasTagOverflow = card.tags.length > visibleTags.length

    return (
        <article
            className={`relative isolate min-h-0 overflow-hidden rounded-[20px] bg-stone-200 ${className}`}
        >
            <Image
                alt={card.title}
                className="object-cover"
                fill
                sizes={sizes}
                src={`/media/${card.mediaId}`}
                unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 text-white sm:p-5">
                <div>
                    <h2 className="font-primary text-base font-medium leading-tight sm:text-lg">
                        {card.title}
                    </h2>
                    {card.year && (
                        <p className="mt-1 text-sm leading-none text-white/80">{card.year}</p>
                    )}
                </div>
                {visibleTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {visibleTags.map((tag) => (
                            <span
                                className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur-sm"
                                key={tag}
                            >
                                {tag}
                            </span>
                        ))}
                        {hasTagOverflow && (
                            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur-sm">
                                ...
                            </span>
                        )}
                    </div>
                )}
            </div>
        </article>
    )
}
