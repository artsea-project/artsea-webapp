"use client"

import { useRef, useState, useSyncExternalStore, type RefObject } from "react"
import Image from "next/image"
import { GripVertical } from "lucide-react"
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

const TOUCH_RESIZE_HANDLES: ResizeHandleAxis[] = ["ne", "se", "sw"]

const COARSE_POINTER = "(pointer: coarse)"

function subscribeToPointer(onChange: () => void) {
    const query = window.matchMedia(COARSE_POINTER)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
}

function useCoarsePointer(): boolean {
    return useSyncExternalStore(
        subscribeToPointer,
        () => window.matchMedia(COARSE_POINTER).matches,
        () => false
    )
}

const PUBLIC_GAP: Record<BentoView, { width: number; gap: number }> = {
    desktop: { width: 1155, gap: 21 },
    mobile: { width: 335, gap: 12 },
}

const EDITOR_GAP_SCALE = 1.8

const MOBILE_SPARE_FIELDS = 2

const AUTO_SCROLL_EDGE = 48

const AUTO_SCROLL_STEP = 10

function pointerY(event: Event): number | null {
    if ("touches" in event) return (event as TouchEvent).touches[0]?.clientY ?? null
    return "clientY" in event ? (event as MouseEvent).clientY : null
}

function scrollStepNearEdge(scroller: HTMLElement, y: number): number {
    const { top, bottom } = scroller.getBoundingClientRect()
    if (y < top + AUTO_SCROLL_EDGE) return -AUTO_SCROLL_STEP
    if (y > bottom - AUTO_SCROLL_EDGE) return AUTO_SCROLL_STEP
    return 0
}

function useEdgeAutoScroll(containerRef: RefObject<HTMLDivElement | null>) {
    const frame = useRef<number | null>(null)
    const step = useRef(0)

    function stop() {
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        frame.current = null
        step.current = 0
    }

    function update(event: Event) {
        const scroller = containerRef.current?.closest<HTMLElement>("[data-bento-scroll]")
        const y = pointerY(event)
        if (!scroller || y === null) return

        step.current = scrollStepNearEdge(scroller, y)
        if (step.current === 0 || frame.current !== null) return

        const tick = () => {
            if (step.current === 0) return stop()
            scroller.scrollBy(0, step.current)
            frame.current = requestAnimationFrame(tick)
        }
        frame.current = requestAnimationFrame(tick)
    }

    return { update, stop }
}

const MIN_GAP = 8

function editorGap(view: BentoView, width: number): number {
    const { width: publicWidth, gap } = PUBLIC_GAP[view]
    return Math.max(MIN_GAP, Math.round((EDITOR_GAP_SCALE * gap * width) / publicWidth))
}

function fieldMetrics(view: BentoView, width: number) {
    const gap = editorGap(view, width)
    const columns = BENTO_VIEW_GRIDS[view].columns / FIELD_SIZE
    const rowHeight = (width - (columns - 1) * gap) / columns
    return { gap, columns, rowHeight }
}

function heightOfRows(rows: number, { rowHeight, gap }: { rowHeight: number; gap: number }) {
    return rows * rowHeight + (rows - 1) * gap
}

export function desktopCanvasHeight(width: number): number {
    return heightOfRows(BENTO_VIEW_GRIDS.desktop.rows / FIELD_SIZE, fieldMetrics("desktop", width))
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

function visibleFieldRows(view: BentoView, items: BentoLayoutItem[], withSpare: boolean): number {
    const maxRows = BENTO_VIEW_GRIDS[view].rows / FIELD_SIZE
    if (view === "desktop") return maxRows

    const bottom = Math.max(0, ...items.map((item) => item.rowStart + item.rowSpan - 1))
    const spare = withSpare ? MOBILE_SPARE_FIELDS : 0
    return Math.min(maxRows, Math.max(1, bottom / FIELD_SIZE + spare))
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
            <span className="bento-drag-handle absolute top-1.5 left-1.5 z-10 flex size-8 cursor-grab touch-none items-center justify-center rounded-md bg-background/85 text-foreground shadow-sm">
                <GripVertical className="size-4" aria-hidden />
                <span className="sr-only">Przeciągnij kafelek {title}</span>
            </span>
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
    const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })
    const autoScroll = useEdgeAutoScroll(containerRef)
    const isCoarsePointer = useCoarsePointer()
    const [revision, setRevision] = useState(0)
    const [swapTargetIds, setSwapTargetIds] = useState<string[]>([])
    const [isMovingTile, setIsMovingTile] = useState(false)
    const grid = BENTO_VIEW_GRIDS[view]
    const metrics = fieldMetrics(view, width)
    const { gap, columns: fieldColumns, rowHeight } = metrics
    const fieldRows = grid.rows / FIELD_SIZE
    const height = heightOfRows(visibleFieldRows(view, items, isMovingTile), metrics)

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

    const handleDrag: EventCallback = (_layout, _oldItem, newItem, _placeholder, event) => {
        autoScroll.update(event)
        const targets = newItem ? findDisplacedTiles(items, newItem.i, toBox(newItem)) : []
        if (targets.join() !== swapTargetIds.join()) setSwapTargetIds(targets)
    }

    const handleResizeStop: EventCallback = (...args) => {
        setIsMovingTile(false)
        moveOrSnapBack(...args)
    }

    const handleDragStop: EventCallback = (layout, oldItem, newItem, ...rest) => {
        autoScroll.stop()
        setIsMovingTile(false)
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
            style={{ minHeight: mounted ? height : undefined }}
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
                    dragConfig={{
                        enabled: true,
                        bounded: true,
                        threshold: 3,
                        handle: isCoarsePointer ? ".bento-drag-handle" : undefined,
                    }}
                    resizeConfig={{
                        enabled: true,
                        handles: isCoarsePointer ? TOUCH_RESIZE_HANDLES : RESIZE_HANDLES,
                    }}
                    compactor={compactor}
                    onDragStart={() => setIsMovingTile(true)}
                    onDrag={handleDrag}
                    onDragStop={handleDragStop}
                    onResizeStart={() => setIsMovingTile(true)}
                    onResizeStop={handleResizeStop}
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
