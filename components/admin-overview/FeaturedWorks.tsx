"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import {
    OVERVIEW_CARD_CLASS,
    OVERVIEW_CARD_LINK_CLASS,
} from "@/components/admin-overview/card-styles"
import OverviewEmptyState from "@/components/admin-overview/OverviewEmptyState"
import OverviewPanel from "@/components/admin-overview/OverviewPanel"
import { bentoImageProps } from "@/components/bento/bento-card"
import { PHONE_WIDTH_TO_HEIGHT, PhoneFrame } from "@/components/bento/phone-frame"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BentoCardData, BentoData } from "@/lib/bento"
import { BENTO_VIEW_LABELS, bentoGridStyle, DESKTOP_GRID, tilePlacement } from "@/lib/bento-grid"
import { cn } from "@/lib/utils"
import type { BentoBoxLayout } from "@/types/bento"

type BentoView = keyof BentoBoxLayout

const VIEWS = Object.keys(BENTO_VIEW_LABELS) as BentoView[]

const PREVIEW_GRID_GAP: Record<BentoView, number> = { desktop: 8, mobile: 4 }

const TILE_IMAGE_SIZES: Record<BentoView, string> = {
    desktop: "(min-width: 1024px) 240px, 50vw",
    mobile: "160px",
}

const PHONE_MIN_HEIGHT = 240

function desktopPreviewHeight(desktopCards: BentoCardData[]): string {
    const usedRows = Math.max(0, ...desktopCards.map((card) => card.rowStart + card.rowSpan - 1))
    const rows = usedRows || DESKTOP_GRID.rows
    const gap = PREVIEW_GRID_GAP.desktop
    const rowHeight = bentoGridStyle("desktop", gap).gridAutoRows

    return `max(${PHONE_MIN_HEIGHT}px, calc(${rows} * ${rowHeight} + ${(rows - 1) * gap}px))`
}

interface FeaturedWorksProps {
    id: string
    title: string
    data: BentoData
}

export default function FeaturedWorks({ id, title, data }: FeaturedWorksProps) {
    return (
        <Tabs defaultValue="desktop">
            <OverviewPanel
                id={id}
                title={title}
                action={
                    <TabsList aria-label="Widok strony głównej">
                        {VIEWS.map((view) => (
                            <TabsTrigger key={view} value={view}>
                                {BENTO_VIEW_LABELS[view]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                }
            >
                <TabsContent value="desktop">
                    <PreviewCard view="desktop" cards={data.desktop}>
                        <BentoTiles view="desktop" cards={data.desktop} />
                    </PreviewCard>
                </TabsContent>
                <TabsContent value="mobile">
                    <PreviewCard view="mobile" cards={data.mobile}>
                        <PhoneFrame
                            style={{
                                height: desktopPreviewHeight(data.desktop),
                                aspectRatio: PHONE_WIDTH_TO_HEIGHT,
                            }}
                        >
                            <BentoTiles view="mobile" cards={data.mobile} />
                        </PhoneFrame>
                    </PreviewCard>
                </TabsContent>
            </OverviewPanel>
        </Tabs>
    )
}

function PreviewCard({
    view,
    cards,
    children,
}: {
    view: BentoView
    cards: BentoCardData[]
    children: ReactNode
}) {
    if (cards.length === 0) {
        return (
            <OverviewEmptyState
                message="Na stronie głównej nie ma jeszcze prac."
                actionLabel="Ułóż stronę główną"
                href="/admin/appearance"
            />
        )
    }

    return (
        <Link
            href="/admin/appearance"
            aria-label={`Prace wyróżnione na stronie głównej, widok ${BENTO_VIEW_LABELS[view]}. Przejdź do Układ i Personalizacja`}
            className={cn("block", OVERVIEW_CARD_CLASS, OVERVIEW_CARD_LINK_CLASS)}
        >
            <div className="@container">{children}</div>
        </Link>
    )
}

function BentoTiles({ view, cards }: { view: BentoView; cards: BentoCardData[] }) {
    return (
        <div className="@container">
            <div className="grid" style={bentoGridStyle(view, PREVIEW_GRID_GAP[view])}>
                {cards.map((card) => (
                    <div
                        key={card.tileId}
                        className="relative overflow-hidden rounded-lg bg-muted"
                        style={tilePlacement(card)}
                    >
                        <Image
                            {...bentoImageProps(card.mediaId, TILE_IMAGE_SIZES[view])}
                            alt={card.title}
                            className="object-cover"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
