"use client"

import { useEffect, useReducer, useState, type ReactNode } from "react"
import { Plus } from "lucide-react"

import { saveBentoLayout } from "@/app/admin/appearance/actions"
import { ArtworkPickerDialog } from "@/components/admin-appearance/ArtworkPickerDialog"
import { BentoGridCanvas } from "@/components/admin-appearance/BentoGridCanvas"
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
import type { BentoBoxLayout } from "@/types/bento"

const VIEWS: BentoView[] = ["desktop", "mobile"]

const VIEW_LABELS: Record<BentoView, string> = { desktop: "Desktop", mobile: "Mobile" }

function PhoneFrame({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto w-full rounded-[2rem] border-4 border-foreground p-3 sm:w-[367px]">
            <div
                data-bento-scroll
                className="h-[560px] overflow-y-auto overscroll-contain rounded-[1.25rem] p-1"
            >
                {children}
            </div>
        </div>
    )
}

function ViewFrame({ view, children }: { view: BentoView; children: ReactNode }) {
    if (view === "mobile") return <PhoneFrame>{children}</PhoneFrame>

    return (
        <div className="w-full max-w-[610px] rounded-xl border border-dashed border-border p-1">
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
    const [preset, setPreset] = useState<TilePreset>("1:1")
    const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
    const { isSaving, isSaved, error, save, reset } = useSectionSave()
    const isDirty = isBentoDirty(state)

    useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

    function pick(content: TileContent) {
        if (pickerTarget?.kind === "add") {
            dispatch({ type: "add", tileId: crypto.randomUUID(), preset, ...content })
        } else if (pickerTarget?.kind === "replace") {
            dispatch({ type: "replaceContent", tileId: pickerTarget.tileId, ...content })
        }
    }

    function handleSave() {
        save(
            async () => {
                const result = await saveBentoLayout(state.draft)
                return result.status === "success" ? null : result.message
            },
            () => dispatch({ type: "saved" })
        )
    }

    function handleRevert() {
        dispatch({ type: "revert" })
        reset()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Tabs
                    value={view}
                    onValueChange={(value) => setView(value as BentoView)}
                    className="min-w-0"
                >
                    <TabsList>
                        {VIEWS.map((name) => (
                            <TabsTrigger key={name} value={name}>
                                {VIEW_LABELS[name]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {VIEWS.map((name) => (
                        <TabsContent key={name} value={name} className="flex flex-col gap-2 pt-4">
                            <ViewFrame view={name}>
                                <BentoGridCanvas
                                    view={name}
                                    items={state.draft[name].items}
                                    artworkMeta={artworkMeta}
                                    onMove={(tileId, box) =>
                                        dispatch({ type: "move", view: name, tileId, box })
                                    }
                                    onSwap={(sourceId, targetIds) =>
                                        dispatch({ type: "swap", view: name, sourceId, targetIds })
                                    }
                                />
                            </ViewFrame>
                            <p className="text-xs text-muted-foreground">
                                Przeciągnij kafelek na wolne miejsce, żeby go przesunąć, albo na
                                inny kafelek, żeby zamienić je miejscami. Uchwytami na rogach i
                                krawędziach zmienisz jego rozmiar.
                            </p>
                        </TabsContent>
                    ))}
                </Tabs>
                <TileList
                    items={state.draft[view].items}
                    artworkMeta={artworkMeta}
                    onReplace={(tileId) => setPickerTarget({ kind: "replace", tileId })}
                    onRemove={(tileId) => dispatch({ type: "remove", tileId })}
                />
            </div>
            <AddTileControls
                preset={preset}
                canAdd={canAddTile(state.draft, preset)}
                onPresetChange={setPreset}
                onAdd={() => setPickerTarget({ kind: "add" })}
            />
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
