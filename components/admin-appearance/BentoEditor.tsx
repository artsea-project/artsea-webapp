"use client"

import { useEffect, useReducer, type ReactNode } from "react"

import { saveBentoLayout } from "@/app/admin/appearance/actions"
import { BentoGridCanvas } from "@/components/admin-appearance/BentoGridCanvas"
import { SaveBar, useSectionSave } from "@/components/admin-appearance/SaveBar"
import { bentoEditorReducer, isBentoDirty } from "@/lib/appearance/bento-editor-state"
import type { ArtworkMeta } from "@/lib/appearance/queries"
import type { BentoBoxLayout } from "@/types/bento"

function ViewFrame({ children }: { children: ReactNode }) {
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
            <div className="flex flex-col gap-2">
                <ViewFrame>
                    <BentoGridCanvas
                        view="desktop"
                        items={state.draft.desktop.items}
                        artworkMeta={artworkMeta}
                        onMove={(tileId, box) =>
                            dispatch({ type: "move", view: "desktop", tileId, box })
                        }
                    />
                </ViewFrame>
                <p className="text-xs text-muted-foreground">
                    Przeciągnij kafelek na wolne miejsce, żeby go przesunąć. Uchwytami na rogach i
                    krawędziach zmienisz jego rozmiar.
                </p>
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
