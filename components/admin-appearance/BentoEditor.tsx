"use client"

import { useEffect, useReducer, useState, type ReactNode } from "react"

import { saveBentoLayout } from "@/app/admin/appearance/actions"
import { BentoGridCanvas } from "@/components/admin-appearance/BentoGridCanvas"
import { SaveBar, useSectionSave } from "@/components/admin-appearance/SaveBar"
import { TileList } from "@/components/admin-appearance/TileList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    bentoEditorReducer,
    isBentoDirty,
    type BentoView,
} from "@/lib/appearance/bento-editor-state"
import type { ArtworkMeta } from "@/lib/appearance/queries"
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

type BentoEditorProps = {
    saved: BentoBoxLayout
    artworkMeta: Record<string, ArtworkMeta>
    onDirtyChange: (isDirty: boolean) => void
}

export function BentoEditor({ saved, artworkMeta, onDirtyChange }: BentoEditorProps) {
    const [state, dispatch] = useReducer(bentoEditorReducer, { saved, draft: saved })
    const [view, setView] = useState<BentoView>("desktop")
    const { isSaving, isSaved, error, save, reset } = useSectionSave()
    const isDirty = isBentoDirty(state)

    useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

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
                <TileList items={state.draft[view].items} artworkMeta={artworkMeta} />
            </div>
            <SaveBar
                isDirty={isDirty}
                isSaving={isSaving}
                isSaved={isSaved}
                error={error}
                onSave={handleSave}
                onRevert={handleRevert}
            />
        </div>
    )
}
