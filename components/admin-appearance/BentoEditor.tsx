"use client"

import type { ReactNode } from "react"

import { BentoGridCanvas } from "@/components/admin-appearance/BentoGridCanvas"
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
    return (
        <ViewFrame>
            <BentoGridCanvas view="desktop" items={saved.desktop.items} artworkMeta={artworkMeta} />
        </ViewFrame>
    )
}
