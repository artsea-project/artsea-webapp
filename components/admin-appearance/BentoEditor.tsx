"use client"

import { useReducer, type ReactNode } from "react"

import { BentoGridCanvas } from "@/components/admin-appearance/BentoGridCanvas"
import { bentoEditorReducer } from "@/lib/appearance/bento-editor-state"
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
}

export function BentoEditor({ saved, artworkMeta }: BentoEditorProps) {
    const [state, dispatch] = useReducer(bentoEditorReducer, { saved, draft: saved })

    return (
        <ViewFrame>
            <BentoGridCanvas
                view="desktop"
                items={state.draft.desktop.items}
                artworkMeta={artworkMeta}
                onMove={(tileId, box) => dispatch({ type: "move", view: "desktop", tileId, box })}
            />
        </ViewFrame>
    )
}
