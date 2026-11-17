"use client"

import { useState } from "react"
import Image from "next/image"
import ReactGridLayout, {
    noCompactor,
    useContainerWidth,
    type EventCallback,
    type Layout,
    type LayoutItem,
    type ResizeHandleAxis,
} from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

import { bentoImageProps } from "@/components/bento/bento-card"
import {
    BENTO_VIEW_GRIDS,
    findDisplacedTiles,
    moveTile,
    swapWithTiles,
    type BentoView,
} from "@/lib/appearance/bento-editor-state"
import type { ArtworkMeta } from "@/lib/appearance/queries"
import { FIELD_SIZE, type TileBox } from "@/lib/bento-grid"
import { cn } from "@/lib/utils"
import type { BentoLayoutItem } from "@/types/bento"

const compactor = { ...noCompactor, allowOverlap: true }

const RESIZE_HANDLES: ResizeHandleAxis[] = ["n", "e", "s", "w", "ne", "nw", "se", "sw"]

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

function toBox(item: LayoutItem): TileBox {
    return {
        columnStart: item.x * FIELD_SIZE + 1,
        rowStart: item.y * FIELD_SIZE + 1,
        columnSpan: item.w * FIELD_SIZE,
        rowSpan: item.h * FIELD_SIZE,
    }
}

function Tile({
    item,
    meta,
    isSwapTarget,
}: {
    item: BentoLayoutItem
    meta?: ArtworkMeta
    isSwapTarget: boolean
}) {
    const title = meta?.title ?? "Bez tytułu"

    return (
        <div
            className={cn(
                "relative size-full cursor-grab overflow-hidden rounded-xl bg-muted ring-offset-2 transition-shadow",
                isSwapTarget ? "ring-4 ring-primary" : "hover:ring-2 hover:ring-primary/60"
            )}
        >
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
    onMove: (tileId: string, box: TileBox) => void
    onSwap: (sourceId: string, targetIds: string[]) => void
}

export function BentoGridCanvas({
    view,
    items,
    artworkMeta,
    onMove,
    onSwap,
}: BentoGridCanvasProps) {
    const { width, containerRef, mounted } = useContainerWidth()
    const [revision, setRevision] = useState(0)
    const [swapTargetIds, setSwapTargetIds] = useState<string[]>([])
    const grid = BENTO_VIEW_GRIDS[view]
    const gap = editorGap(view, width)
    const fieldColumns = grid.columns / FIELD_SIZE
    const fieldRows = grid.rows / FIELD_SIZE
    const rowHeight = (width - (fieldColumns - 1) * gap) / fieldColumns
    const height = fieldRows * rowHeight + (fieldRows - 1) * gap

    function snapBack() {
        setRevision(revision + 1)
    }

    const moveOrSnapBack: EventCallback = (_layout, _oldItem, newItem) => {
        const box = newItem && toBox(newItem)
        if (newItem && box && moveTile(items, newItem.i, box, grid)) {
            onMove(newItem.i, box)
        } else {
            snapBack()
        }
    }

    const highlightSwapTargets: EventCallback = (_layout, _oldItem, newItem) => {
        const targets = newItem ? findDisplacedTiles(items, newItem.i, toBox(newItem)) : []
        if (targets.join() !== swapTargetIds.join()) setSwapTargetIds(targets)
    }

    const handleDragStop: EventCallback = (layout, oldItem, newItem, ...rest) => {
        setSwapTargetIds([])
        const targets = newItem ? findDisplacedTiles(items, newItem.i, toBox(newItem)) : []
        if (targets.length === 0) return moveOrSnapBack(layout, oldItem, newItem, ...rest)

        if (newItem && swapWithTiles(items, newItem.i, targets, grid)) {
            onSwap(newItem.i, targets)
        } else {
            snapBack()
        }
    }

    return (
        <div
            ref={containerRef}
            className="bento-canvas relative w-full"
            style={{ minHeight: height }}
        >
            {mounted && (
                <ReactGridLayout
                    key={revision}
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
                    dragConfig={{ enabled: true, bounded: true, threshold: 3 }}
                    resizeConfig={{ enabled: true, handles: RESIZE_HANDLES }}
                    compactor={compactor}
                    onDrag={highlightSwapTargets}
                    onDragStop={handleDragStop}
                    onResizeStop={moveOrSnapBack}
                >
                    {items.map((item) => (
                        <div key={item.tileId}>
                            <Tile
                                item={item}
                                meta={artworkMeta[item.artPieceId]}
                                isSwapTarget={swapTargetIds.includes(item.tileId)}
                            />
                        </div>
                    ))}
                </ReactGridLayout>
            )}
        </div>
    )
}
