import type { ReactNode } from "react"

interface OverviewPanelProps {
    id: string
    title: string
    action?: ReactNode
    children?: ReactNode
}

export default function OverviewPanel({ id, title, action, children }: OverviewPanelProps) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-3">
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h3 id={id} className="text-sm text-muted-foreground">
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </section>
    )
}
