import type { ReactNode } from "react"

interface OverviewPanelProps {
    id: string
    title: string
    children: ReactNode
}

export default function OverviewPanel({ id, title, children }: OverviewPanelProps) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-3">
            <h3 id={id} className="text-sm text-muted-foreground">
                {title}
            </h3>
            {children}
        </section>
    )
}
