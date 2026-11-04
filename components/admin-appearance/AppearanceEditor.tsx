"use client"

import { useState, type ReactNode } from "react"

import { useLeaveGuard } from "@/components/AdminLeaveGuard"
import { BentoEditor } from "@/components/admin-appearance/BentoEditor"
import { ThemeEditor } from "@/components/admin-appearance/ThemeEditor"
import type { AppearanceData } from "@/lib/appearance/queries"

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-4">
            <h2 id={id} className="text-xl font-bold text-foreground">
                {title}
            </h2>
            <div className="rounded-xl border bg-background p-4 sm:p-6">{children}</div>
        </section>
    )
}

export function AppearanceEditor({ data }: { data: AppearanceData }) {
    const [bentoDirty, setBentoDirty] = useState(false)
    const [themeDirty, setThemeDirty] = useState(false)
    const leaveDialog = useLeaveGuard(
        bentoDirty || themeDirty,
        "Jeśli wyjdziesz, niezapisane zmiany w układzie i personalizacji przepadną."
    )

    return (
        <div className="flex max-w-5xl flex-col gap-10">
            <Section id="bento-heading" title="Kafelki BentoBox - strona główna">
                <BentoEditor
                    saved={data.layout}
                    artworkMeta={data.artworkMeta}
                    artworks={data.artworks}
                    onDirtyChange={setBentoDirty}
                />
            </Section>
            <Section id="theme-heading" title="Czcionki i kolorystyka">
                <ThemeEditor saved={data.theme} onDirtyChange={setThemeDirty} />
            </Section>
            {leaveDialog}
        </div>
    )
}
