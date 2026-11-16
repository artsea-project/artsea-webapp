import { useTranslations } from "next-intl"

import type { BentoCardData, BentoData } from "@/lib/bento"

import { BentoCard } from "./bento-card"

type LayoutKind = "desktop" | "mobile"

const VISIBILITY_CLASSES: Record<LayoutKind, string> = {
    desktop: "hidden md:block",
    mobile: "md:hidden",
}

const GRID_CLASSES: Record<LayoutKind, string> = {
    desktop: "grid grid-cols-11 auto-rows-[21px] gap-x-[21px] gap-y-8",
    mobile: "grid grid-cols-2 auto-rows-[28px] gap-3",
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
        <div className={VISIBILITY_CLASSES[kind]}>
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
