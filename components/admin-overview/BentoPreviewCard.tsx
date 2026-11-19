import Image from "next/image"
import Link from "next/link"

import { bentoImageProps } from "@/components/bento/bento-card"
import type { BentoCardData } from "@/lib/bento"

interface BentoPreviewCardProps {
    works: BentoCardData[]
}

/** Miniature preview of the public Bento grid linking to the appearance editor. */
export default function BentoPreviewCard({ works }: BentoPreviewCardProps) {
    return (
        <Link
            href="/admin/appearance"
            aria-label="Przejdź do edycji układu strony głównej"
            className="flex min-h-99 flex-col rounded-xl border border-border bg-background p-7 transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            {works.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Brak prac wyróżnionych w układzie strony głównej.
                </div>
            ) : (
                <div
                    aria-hidden="true"
                    className="grid flex-1 grid-cols-11 gap-2"
                    style={{ gridAutoRows: "minmax(10px, 1fr)" }}
                >
                    {works.map((work) => (
                        <div
                            key={`${work.artPieceId}-${work.mediaId}-${work.columnStart}-${work.rowStart}`}
                            className="relative min-h-0 overflow-hidden rounded-lg bg-muted"
                            style={{
                                gridColumn: `${work.columnStart} / span ${work.columnSpan}`,
                                gridRow: `${work.rowStart} / span ${work.rowSpan}`,
                            }}
                        >
                            <Image
                                {...bentoImageProps(
                                    work.mediaId,
                                    "(min-width: 1024px) 220px, 45vw"
                                )}
                                alt=""
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}
        </Link>
    )
}
