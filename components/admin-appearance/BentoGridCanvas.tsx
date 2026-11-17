"use client"

import Image from "next/image"
import ReactGridLayout, { noCompactor, useContainerWidth, type Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

import { bentoImageProps } from "@/components/bento/bento-card"
import { BENTO_VIEW_GRIDS, type BentoView } from "@/lib/appearance/bento-editor-state"
import type { ArtworkMeta } from "@/lib/appearance/queries"
import { FIELD_SIZE } from "@/lib/bento-grid"
import type { BentoLayoutItem } from "@/types/bento"

const PUBLIC_GAP: Record<BentoView, { width: number; gap: number }> = {
    desktop: { width: 1155, gap: 21 },
    mobile: { width: 335, gap: 12 },
}

const EDITOR_GAP_SCALE = 1.8

const MIN_GAP = 8

function editorGap(view: BentoView, width: number): number {
    const { width: publicWidth, gap } = PUBLIC_GAP[view]
    return Math.max(MIN_GAP, Math.round((EDITOR_GAP_SCALE * gap * width) / publicWidth))
}

function toGridItems(items: BentoLayoutItem[]): Layout {
    return items.map((item) => ({
        i: item.tileId,
        x: (item.columnStart - 1) / FIELD_SIZE,
        y: (item.rowStart - 1) / FIELD_SIZE,
        w: item.columnSpan / FIELD_SIZE,
        h: item.rowSpan / FIELD_SIZE,
        minW: 1,
        minH: 1,
        maxW: 2,
        maxH: 2,
    }))
}

function Tile({ item, meta }: { item: BentoLayoutItem; meta?: ArtworkMeta }) {
    const title = meta?.title ?? "Bez tytułu"

    return (
        <div className="relative size-full overflow-hidden rounded-xl bg-muted">
            <Image
                {...bentoImageProps(item.mediaId, "(min-width: 1024px) 25vw, 50vw")}
                alt={title}
                draggable={false}
                className="pointer-events-none object-cover"
            />
            {meta?.isVisible === false && (
                <span className="absolute right-1.5 bottom-1.5 rounded-full bg-background/85 px-2 py-0.5 text-xs text-foreground">
                    Ukryta
                </span>
            )}
        </div>
    )
}

type BentoGridCanvasProps = {
    view: BentoView
    items: BentoLayoutItem[]
    artworkMeta: Record<string, ArtworkMeta>
}

export function BentoGridCanvas({ view, items, artworkMeta }: BentoGridCanvasProps) {
    const { width, containerRef, mounted } = useContainerWidth()
    const grid = BENTO_VIEW_GRIDS[view]
    const gap = editorGap(view, width)
    const fieldColumns = grid.columns / FIELD_SIZE
    const fieldRows = grid.rows / FIELD_SIZE
    const rowHeight = (width - (fieldColumns - 1) * gap) / fieldColumns
    const height = fieldRows * rowHeight + (fieldRows - 1) * gap

    return (
        <div ref={containerRef} className="relative w-full" style={{ minHeight: height }}>
            {mounted && (
                <ReactGridLayout
                    width={width}
                    autoSize={false}
                    style={{ height }}
                    layout={toGridItems(items)}
                    gridConfig={{
                        cols: fieldColumns,
                        rowHeight,
                        margin: [gap, gap],
                        containerPadding: [0, 0],
                        maxRows: fieldRows,
                    }}
                    dragConfig={{ enabled: false }}
                    resizeConfig={{ enabled: false }}
                    compactor={noCompactor}
                >
                    {items.map((item) => (
                        <div key={item.tileId}>
                            <Tile item={item} meta={artworkMeta[item.artPieceId]} />
                        </div>
                    ))}
                </ReactGridLayout>
            )}
        </div>
    )
}
