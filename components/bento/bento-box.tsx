import type { BentoCardData, BentoData } from "@/lib/bento"

import { BentoCard } from "./bento-card"

type LayoutKind = "desktop" | "mobile"

// Rows are as tall as a column is wide, so every cell is square: the row height is the
// container width minus the gaps between columns, divided by the column count.
const GRID_CLASSES: Record<LayoutKind, string> = {
    desktop: "grid grid-cols-12 gap-[21px] auto-rows-[calc((100cqw-231px)/12)]",
    mobile: "grid grid-cols-6 gap-3 auto-rows-[calc((100cqw-60px)/6)]",
}

const VISIBILITY_CLASSES: Record<LayoutKind, string> = {
    desktop: "hidden md:block",
    mobile: "md:hidden",
}

const IMAGE_SIZES: Record<LayoutKind, string> = {
    desktop: "(min-width: 1280px) 420px, (min-width: 768px) 35vw",
    mobile: "(max-width: 767px) 90vw",
}

function gridPlacement(card: BentoCardData) {
    return {
        gridColumn: `${card.columnStart} / span ${card.columnSpan}`,
        gridRow: `${card.rowStart} / span ${card.rowSpan}`,
    }
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
            <div className={GRID_CLASSES[kind]}>
                {cards.map((card) => (
                    <BentoCard
                        card={card}
                        key={card.tileId}
                        sizes={IMAGE_SIZES[kind]}
                        style={gridPlacement(card)}
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
