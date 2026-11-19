import type { BentoCardData, BentoData } from "@/lib/bento"
import { bentoGridStyle, PUBLIC_GRID_GAP, tilePlacement } from "@/lib/bento-grid"
import type { BentoBoxLayout } from "@/types/bento"

import { BentoCard } from "./bento-card"

type LayoutKind = keyof BentoBoxLayout

const VISIBILITY_CLASSES: Record<LayoutKind, string> = {
    desktop: "hidden md:block",
    mobile: "md:hidden",
}

const IMAGE_SIZES: Record<LayoutKind, string> = {
    desktop: "(min-width: 1280px) 420px, (min-width: 768px) 35vw",
    mobile: "(max-width: 767px) 90vw",
}

function Layout({ cards, kind }: { cards: BentoCardData[]; kind: LayoutKind }) {
    if (cards.length === 0) {
        return (
            <p className={`${VISIBILITY_CLASSES[kind]} py-16 text-base text-muted-foreground`}>
                Selected works will appear here soon.
            </p>
        )
    }

    return (
        <div className={`${VISIBILITY_CLASSES[kind]} @container`}>
            <div className="grid" style={bentoGridStyle(kind, PUBLIC_GRID_GAP[kind])}>
                {cards.map((card) => (
                    <BentoCard
                        card={card}
                        key={card.tileId}
                        sizes={IMAGE_SIZES[kind]}
                        style={tilePlacement(card)}
                    />
                ))}
            </div>
        </div>
    )
}

export function BentoBox({ data }: { data: BentoData }) {
    return (
        <>
            <Layout cards={data.desktop} kind="desktop" />
            <Layout cards={data.mobile} kind="mobile" />
        </>
    )
}
