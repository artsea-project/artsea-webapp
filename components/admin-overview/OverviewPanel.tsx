import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export const OVERVIEW_CARD_CLASSES = "rounded-xl border border-border bg-background"

export const OVERVIEW_CARD_LINK_CLASSES = cn(
    OVERVIEW_CARD_CLASSES,
    "transition-colors hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
)

interface OverviewPanelProps {
    id: string
    title: string
    children: ReactNode
}

/** A labelled column of the overview: a short caption above its card. */
export default function OverviewPanel({ id, title, children }: OverviewPanelProps) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-5">
            <h3 id={id} className="text-sm font-normal text-muted-foreground">
                {title}
            </h3>
            {children}
        </section>
    )
}
