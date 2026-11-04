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
import type { BentoLayoutItem } from "@/types/bento"

/** Gap between cells at the width the public page renders each view, scaled with the canvas. */
const REFERENCE_GAP: Record<BentoView, { width: number; gap: number }> = {
    desktop: { width: 1155, gap: 21 },
    mobile: { width: 335, gap: 12 },
}

/**
 * The editor canvas is much narrower than the public page, so a proportionally scaled gap
 * becomes a hairline that makes neighbouring tiles hard to tell apart. Widen it on the canvas.
 */
const EDITOR_GAP_SCALE = 1.8

/** Extra empty fields below the lowest mobile tile, so a tile can be dragged further down. */
const MOBILE_SPARE_FIELDS = 2

// Tiles may overlap while one is being dragged; the drop decides between a swap, a move and
// snapping back, so nothing is pushed aside on the way.
const compactor = { ...noCompactor, allowOverlap: true }

const ALL_HANDLES: ResizeHandleAxis[] = ["n", "e", "s", "w", "ne", "nw", "se", "sw"]
// On touch screens the top left corner belongs to the drag grip, so it has no resize handle.
const TOUCH_HANDLES: ResizeHandleAxis[] = ["ne", "se", "sw"]

const COARSE_POINTER = "(pointer: coarse)"

function subscribeToPointer(onChange: () => void) {
    const query = window.matchMedia(COARSE_POINTER)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
}

/** Touch screens drag tiles by their grip only, so swiping elsewhere still scrolls the page. */
function useCoarsePointer(): boolean {
    return useSyncExternalStore(
        subscribeToPointer,
        () => window.matchMedia(COARSE_POINTER).matches,
        () => false
    )
}

// The editor grid works in 1:1 fields rather than cells: one or two fields per side is exactly
// the four allowed sizes, so dragging and resizing can only produce 1:1, 2:1, 1:2 and 2:2.
const AUTO_SCROLL_EDGE = 48
const AUTO_SCROLL_STEP = 10

function pointerY(event: Event): number | null {
    if ("touches" in event) return (event as TouchEvent).touches[0]?.clientY ?? null
    return "clientY" in event ? (event as MouseEvent).clientY : null
}

/**
 * Scrolls the surrounding phone screen (marked with data-bento-scroll) while a tile is dragged
 * near its top or bottom edge, and keeps scrolling as long as the pointer stays there.
 */
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

        const { top, bottom } = scroller.getBoundingClientRect()
        step.current =
            y < top + AUTO_SCROLL_EDGE
                ? -AUTO_SCROLL_STEP
                : y > bottom - AUTO_SCROLL_EDGE
                  ? AUTO_SCROLL_STEP
                  : 0
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

/** Mobile ends at the lowest tile, plus spare fields only while a tile is being moved. */
function visibleFieldRows(view: BentoView, items: BentoLayoutItem[], withSpare: boolean): number {
    const maxRows = BENTO_VIEW_GRIDS[view].rows / FIELD_SIZE
    if (view === "desktop") return maxRows

    const bottom = Math.max(0, ...items.map((item) => item.rowStart + item.rowSpan - 1))
    const spare = withSpare ? MOBILE_SPARE_FIELDS : 0
    return Math.min(maxRows, Math.max(1, bottom / FIELD_SIZE + spare))
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
            className={`relative size-full overflow-hidden rounded-xl bg-muted transition-shadow ${isSwapTarget ? "ring-4 ring-primary ring-offset-2" : "hover:ring-2 hover:ring-primary/60 hover:ring-offset-2"}`}
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
    const { width, containerRef, mounted } = useContainerWidth()
    const autoScroll = useEdgeAutoScroll(containerRef)
    const isCoarse = useCoarsePointer()
    const [swapTargetIds, setSwapTargetIds] = useState<string[]>([])
    // Remounting the grid is how a rejected drop snaps back: the library keeps the dropped
    // position otherwise, because the layout passed in did not change.
    const [revision, setRevision] = useState(0)
    const grid = BENTO_VIEW_GRIDS[view]
    const reference = REFERENCE_GAP[view]
    const gap = Math.max(
        8,
        Math.round((EDITOR_GAP_SCALE * reference.gap * width) / reference.width)
    )
    const fieldColumns = grid.columns / FIELD_SIZE
    const rowHeight = (width - (fieldColumns - 1) * gap) / fieldColumns
    const [isMovingTile, setIsMovingTile] = useState(false)
    const rows = visibleFieldRows(view, items, isMovingTile)
    const height = rows * rowHeight + (rows - 1) * gap

    const handleDrag: EventCallback = (_layout, _oldItem, newItem, _placeholder, event) => {
        autoScroll.update(event)
        const targets = newItem ? findDisplacedTiles(items, newItem.i, toBox(newItem)) : []
        if (targets.join() !== swapTargetIds.join()) setSwapTargetIds(targets)
    }

    const handleDragStop: EventCallback = (_layout, _oldItem, newItem) => {
        autoScroll.stop()
        setIsMovingTile(false)
        setSwapTargetIds([])
        if (!newItem) return

        const box = toBox(newItem)
        const targets = findDisplacedTiles(items, newItem.i, box)
        if (targets.length > 0 && swapWithTiles(items, newItem.i, targets, grid)) {
            onSwap(newItem.i, targets)
        } else if (targets.length === 0 && moveTile(items, newItem.i, box, grid)) {
            onMove(newItem.i, box)
        } else {
            setRevision(revision + 1)
        }
    }

    const handleResizeStop: EventCallback = (_layout, _oldItem, newItem) => {
        setIsMovingTile(false)
        if (newItem && moveTile(items, newItem.i, toBox(newItem), grid)) {
            onMove(newItem.i, toBox(newItem))
        } else {
            setRevision(revision + 1)
        }
    }

    return (
        <div
            ref={containerRef}
            className="bento-canvas relative w-full"
            style={{ minHeight: height }}
        >
            {mounted && (
                // The grid keeps its own fixed height, so a dragged tile stays inside it instead
                // of being cut down to fit the last row.
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
                        maxRows: grid.rows / FIELD_SIZE,
                    }}
                    dragConfig={{
                        enabled: true,
                        bounded: true,
                        threshold: 3,
                        handle: isCoarse ? ".bento-drag-handle" : undefined,
                    }}
                    resizeConfig={{
                        enabled: true,
                        handles: isCoarse ? TOUCH_HANDLES : ALL_HANDLES,
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
