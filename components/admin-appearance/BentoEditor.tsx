"use client"

import { useEffect, useLayoutEffect, useReducer, useState, type ReactNode } from "react"
import { Plus } from "lucide-react"
import { useContainerWidth } from "react-grid-layout"

import { saveBentoLayout } from "@/app/admin/appearance/actions"
import { ArtworkPickerDialog } from "@/components/admin-appearance/ArtworkPickerDialog"
import { BentoGridCanvas, desktopCanvasHeight } from "@/components/admin-appearance/BentoGridCanvas"
import { SaveBar, useSectionSave } from "@/components/admin-appearance/SaveBar"
import { TileList } from "@/components/admin-appearance/TileList"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    bentoEditorReducer,
    canAddTile,
    isBentoDirty,
    type BentoView,
    type TileContent,
} from "@/lib/appearance/bento-editor-state"
import type { ArtworkMeta, PickerArtwork } from "@/lib/appearance/queries"
import { TILE_PRESETS, type TilePreset } from "@/lib/bento-grid"
import { createTileId } from "@/lib/bento-layout"
import type { BentoBoxLayout } from "@/types/bento"

const VIEWS: BentoView[] = ["desktop", "mobile"]

const VIEW_LABELS: Record<BentoView, string> = { desktop: "Desktop", mobile: "Mobile" }

const DESKTOP_FRAME_MAX_WIDTH = 610

const DESKTOP_FRAME_BORDER_AND_PADDING = 5

function desktopFrameHeight(availableWidth: number): number {
    const frameWidth = Math.min(DESKTOP_FRAME_MAX_WIDTH, availableWidth)
    const inset = 2 * DESKTOP_FRAME_BORDER_AND_PADDING
    return desktopCanvasHeight(frameWidth - inset) + inset
}

const PHONE_MAX_WIDTH = 367

const PHONE_MIN_MATCHED_WIDTH = 240

const PHONE_WIDTH_TO_HEIGHT = PHONE_MAX_WIDTH / 592

type FrameSize = { width: number; height: number }

function phoneFrameSize(availableWidth: number): FrameSize {
    const matchedHeight = desktopFrameHeight(availableWidth)
    const matchedWidth = matchedHeight * PHONE_WIDTH_TO_HEIGHT
    if (matchedWidth >= PHONE_MIN_MATCHED_WIDTH)
        return { width: matchedWidth, height: matchedHeight }

    const width = Math.min(availableWidth, PHONE_MAX_WIDTH)
    return { width, height: width / PHONE_WIDTH_TO_HEIGHT }
}

function previewFrameHeight(view: BentoView, availableWidth: number): number {
    return view === "mobile"
        ? phoneFrameSize(availableWidth).height
        : desktopFrameHeight(availableWidth)
}

function PhoneFrame({ size, children }: { size?: FrameSize; children: ReactNode }) {
    return (
        <div
            className="mx-auto max-w-full rounded-[2rem] border-4 border-foreground p-3"
            style={size}
        >
            <div
                data-bento-scroll
                className="h-full [scrollbar-gutter:stable] overflow-y-auto overscroll-contain rounded-[1.25rem] p-1"
            >
                {children}
            </div>
        </div>
    )
}

function ViewFrame({
    view,
    phoneSize,
    children,
}: {
    view: BentoView
    phoneSize?: FrameSize
    children: ReactNode
}) {
    if (view === "mobile") return <PhoneFrame size={phoneSize}>{children}</PhoneFrame>

    return (
        <div
            className="w-full rounded-xl border border-dashed border-border p-1"
            style={{ maxWidth: DESKTOP_FRAME_MAX_WIDTH }}
        >
            {children}
        </div>
    )
}

const NO_ROOM_MESSAGE =
    "Brak miejsca na kafelek w tym rozmiarze. Zmniejsz albo usuń inny kafelek albo wybierz mniejszy rozmiar."

function AddTileControls({
    preset,
    canAdd,
    onPresetChange,
    onAdd,
}: {
    preset: TilePreset
    canAdd: boolean
    onPresetChange: (preset: TilePreset) => void
    onAdd: () => void
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
                <span id="tile-size-label" className="text-sm font-medium">
                    Rozmiar nowego kafelka:
                </span>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    value={preset}
                    onValueChange={(value) => value && onPresetChange(value as TilePreset)}
                    aria-labelledby="tile-size-label"
                >
                    {(Object.keys(TILE_PRESETS) as TilePreset[]).map((name) => (
                        <ToggleGroupItem key={name} value={name} className="px-3">
                            {name}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
                <Button type="button" onClick={onAdd} disabled={!canAdd}>
                    <Plus aria-hidden />
                    Dodaj kafelek
                </Button>
            </div>
            {!canAdd && <p className="text-sm text-muted-foreground">{NO_ROOM_MESSAGE}</p>}
        </div>
    )
}

type PickerTarget = { kind: "add" } | { kind: "replace"; tileId: string }

type BentoEditorProps = {
    saved: BentoBoxLayout
    artworkMeta: Record<string, ArtworkMeta>
    artworks: PickerArtwork[]
    onDirtyChange: (isDirty: boolean) => void
}

export function BentoEditor({ saved, artworkMeta, artworks, onDirtyChange }: BentoEditorProps) {
    const [state, dispatch] = useReducer(bentoEditorReducer, { saved, draft: saved })
    const [view, setView] = useState<BentoView>("desktop")
    const {
        width: frameAreaWidth,
        containerRef: frameAreaRef,
        mounted: isFrameAreaMeasured,
    } = useContainerWidth({ measureBeforeMount: true })
    const phoneSize = isFrameAreaMeasured ? phoneFrameSize(frameAreaWidth) : undefined
    const previewHeight = isFrameAreaMeasured ? previewFrameHeight(view, frameAreaWidth) : undefined
    const [preset, setPreset] = useState<TilePreset>("1:1")
    const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
    const { isSaving, isSaved, error, save, reset } = useSectionSave()
    const isDirty = isBentoDirty(state)

    useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

    useLayoutEffect(() => {
        return () => {
            dispatch({ type: "revert" })
            setPickerTarget(null)
            reset()
        }
    }, [reset])

    function pick(content: TileContent) {
        if (pickerTarget?.kind === "add") {
            dispatch({ type: "add", tileId: createTileId(), preset, ...content })
        } else if (pickerTarget?.kind === "replace") {
            dispatch({ type: "replaceContent", tileId: pickerTarget.tileId, ...content })
        }
    }

    function handleSave() {
        const layout = state.draft
        save(
            async () => {
                const result = await saveBentoLayout(layout)
                return result.status === "success" ? null : result.message
            },
            () => dispatch({ type: "saved", layout })
        )
    }

    function handleRevert() {
        dispatch({ type: "revert" })
        reset()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 flex-col gap-6">
                    <Tabs value={view} onValueChange={(value) => setView(value as BentoView)}>
                        <TabsList>
                            {VIEWS.map((name) => (
                                <TabsTrigger key={name} value={name}>
                                    {VIEW_LABELS[name]}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <div ref={frameAreaRef}>
                            {VIEWS.map((name) => (
                                <TabsContent
                                    key={name}
                                    value={name}
                                    className="flex flex-col gap-4 pt-4"
                                >
                                    <ViewFrame view={name} phoneSize={phoneSize}>
                                        <BentoGridCanvas
                                            view={name}
                                            items={state.draft[name].items}
                                            artworkMeta={artworkMeta}
                                            onMove={(tileId, box) =>
                                                dispatch({ type: "move", view: name, tileId, box })
                                            }
                                            onSwap={(sourceId, targetIds) =>
                                                dispatch({
                                                    type: "swap",
                                                    view: name,
                                                    sourceId,
                                                    targetIds,
                                                })
                                            }
                                        />
                                    </ViewFrame>
                                    <p className="text-xs text-muted-foreground">
                                        Przeciągnij kafelek na wolne miejsce, żeby go przesunąć,
                                        albo na inny kafelek, żeby zamienić je miejscami. Uchwytami
                                        na rogach i krawędziach zmienisz jego rozmiar.
                                    </p>
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                    <AddTileControls
                        preset={preset}
                        canAdd={canAddTile(state.draft, preset)}
                        onPresetChange={setPreset}
                        onAdd={() => setPickerTarget({ kind: "add" })}
                    />
                </div>
                <TileList
                    items={state.draft[view].items}
                    maxHeight={previewHeight}
                    artworkMeta={artworkMeta}
                    onReplace={(tileId) => setPickerTarget({ kind: "replace", tileId })}
                    onRemove={(tileId) => dispatch({ type: "remove", tileId })}
                />
            </div>
            <SaveBar
                isDirty={isDirty}
                isSaving={isSaving}
                isSaved={isSaved}
                error={error}
                onSave={handleSave}
                onRevert={handleRevert}
            />
            <ArtworkPickerDialog
                open={pickerTarget !== null}
                title={pickerTarget?.kind === "add" ? "Dodaj kafelek" : "Zmień pracę albo zdjęcie"}
                artworks={artworks}
                onOpenChange={(open) => !open && setPickerTarget(null)}
                onPick={pick}
            />
        </div>
    )
}
