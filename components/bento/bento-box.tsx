import { useTranslations } from "next-intl"
import type { CSSProperties } from "react"

import type { BentoCardData, BentoData } from "@/lib/bento"
import { BENTO_VIEW_GRIDS, PUBLIC_GRID_GAP } from "@/lib/bento-grid"
import type { BentoBoxLayout } from "@/types/bento"

import { BentoCard } from "./bento-card"

type LayoutKind = keyof BentoBoxLayout

const VISIBILITY_CLASSES: Record<LayoutKind, string> = {
    desktop: "hidden md:block",
    mobile: "md:hidden",
}

function gridStyle(kind: LayoutKind): CSSProperties {
    const { columns } = BENTO_VIEW_GRIDS[kind]
    const gap = PUBLIC_GRID_GAP[kind]
    return {
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: `calc((100cqw - ${(columns - 1) * gap}px) / ${columns})`,
        gap,
    }
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
    const t = useTranslations("Home")

    if (cards.length === 0) {
        return (
            <p className={`${VISIBILITY_CLASSES[kind]} py-16 text-base text-muted-foreground`}>
                {t("empty")}
            </p>
        )
    }

    return (
        <div className={`${VISIBILITY_CLASSES[kind]} @container`}>
            <div className="grid" style={gridStyle(kind)}>
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
