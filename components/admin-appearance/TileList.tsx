"use client"

import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"

import { bentoImageProps } from "@/components/bento/bento-card"
import { Button } from "@/components/ui/button"
import type { ArtworkMeta } from "@/lib/appearance/queries"
import { describePreset } from "@/lib/bento-grid"
import type { BentoLayoutItem } from "@/types/bento"

type TileListProps = {
    items: BentoLayoutItem[]
    artworkMeta: Record<string, ArtworkMeta>
    onReplace: (tileId: string) => void
    onRemove: (tileId: string) => void
}

export function TileList({ items, artworkMeta, onReplace, onRemove }: TileListProps) {
    // Next to the editor, the heading is as tall as the view tabs and the gap below it matches
    // the space between the tabs and the editor frame, so the first item lines up with the
    // frame's top edge.
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
                    {items.map((item) => {
                        const meta = artworkMeta[item.artPieceId]
                        const title = meta?.title ?? "Bez tytułu"

                        return (
                            <li
                                key={item.tileId}
                                className="flex items-center gap-3 rounded-lg border bg-background p-2"
                            >
                                <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                                    <Image
                                        {...bentoImageProps(item.mediaId, "40px")}
                                        alt=""
                                        className="object-cover"
                                    />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-medium">{title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        Rozmiar: {describePreset(item) ?? "nietypowy"}
                                        {meta?.isVisible === false && ", praca ukryta"}
                                    </span>
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Zmień pracę albo zdjęcie: ${title}`}
                                    onClick={() => onReplace(item.tileId)}
                                >
                                    <Pencil aria-hidden />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Usuń kafelek: ${title}`}
                                    onClick={() => onRemove(item.tileId)}
                                >
                                    <Trash2 aria-hidden />
                                </Button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
