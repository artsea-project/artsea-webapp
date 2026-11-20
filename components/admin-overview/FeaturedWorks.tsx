import Image from "next/image"
import Link from "next/link"

import {
    OVERVIEW_CARD_CLASS,
    OVERVIEW_CARD_LINK_CLASS,
} from "@/components/admin-overview/card-styles"
import { bentoImageProps } from "@/components/bento/bento-card"
import type { BentoCardData } from "@/lib/bento"
import { bentoGridStyle, tilePlacement } from "@/lib/bento-grid"
import { cn } from "@/lib/utils"

const OVERVIEW_GRID_GAP = 8

const TILE_IMAGE_SIZES = "(min-width: 1024px) 240px, 50vw"

interface FeaturedWorksProps {
    cards: BentoCardData[]
}

export default function FeaturedWorks({ cards }: FeaturedWorksProps) {
    return (
        <Link
            href="/admin/appearance"
            aria-label="Prace wyróżnione na stronie głównej. Przejdź do Układ i Personalizacja"
            className={cn("block", OVERVIEW_CARD_CLASS, OVERVIEW_CARD_LINK_CLASS)}
        >
            <div className="@container">
                <div className="grid" style={bentoGridStyle("desktop", OVERVIEW_GRID_GAP)}>
                    {cards.map((card) => (
                        <div
                            key={card.tileId}
                            className="relative overflow-hidden rounded-lg bg-muted"
                            style={tilePlacement(card)}
                        >
                            <Image
                                {...bentoImageProps(card.mediaId, TILE_IMAGE_SIZES)}
                                alt={card.title}
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Link>
    )
}
