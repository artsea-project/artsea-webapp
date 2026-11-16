import type { ReactNode } from "react"

function Section({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-4">
            <h2 id={id} className="text-xl font-bold text-foreground">
                {title}
            </h2>
            <div className="rounded-xl border bg-background p-4 sm:p-6">{children}</div>
        </section>
    )
}

export function AppearanceEditor() {
    return (
        <div className="flex max-w-5xl flex-col gap-10">
            <Section id="bento-heading" title="Kafelki BentoBox - strona główna" />
            <Section id="theme-heading" title="Czcionki i kolorystyka" />
        </div>
    )
}
