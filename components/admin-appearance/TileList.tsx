import Image from "next/image"

import { bentoImageProps } from "@/components/bento/bento-card"
import type { ArtworkMeta } from "@/lib/appearance/queries"
import { describePreset } from "@/lib/bento-grid"
import type { BentoLayoutItem } from "@/types/bento"

type TileListProps = {
    items: BentoLayoutItem[]
    artworkMeta: Record<string, ArtworkMeta>
}

function TileRow({ item, meta }: { item: BentoLayoutItem; meta?: ArtworkMeta }) {
    return (
        <li className="flex items-center gap-3 rounded-lg border bg-background p-2">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image {...bentoImageProps(item.mediaId, "40px")} alt="" className="object-cover" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{meta?.title ?? "Bez tytułu"}</span>
                <span className="text-xs text-muted-foreground">
                    Rozmiar: {describePreset(item)}
                    {meta?.isVisible === false && ", praca ukryta"}
                </span>
            </span>
        </li>
    )
}

export function TileList({ items, artworkMeta }: TileListProps) {
    return (
        <section className="flex flex-col gap-6" aria-labelledby="tile-list-heading">
            <h3
                id="tile-list-heading"
                className="flex h-9 items-center gap-1 text-sm font-semibold"
            >
                Lista kafelków{" "}
                <span className="font-normal text-muted-foreground">({items.length})</span>
            </h3>
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Brak kafelków. Strona główna pokaże pusty stan.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                        <TileRow
                            key={item.tileId}
                            item={item}
                            meta={artworkMeta[item.artPieceId]}
                        />
                    ))}
                </ul>
            )}
        </section>
    )
}
