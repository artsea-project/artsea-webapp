import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatCardProps {
    label: string
    value: number
    icon: LucideIcon
    href?: string
    note?: string | null
}

const CARD_CLASS = "flex flex-col gap-2 rounded-lg border border-border bg-background p-6"

export default function StatCard({ label, value, icon: Icon, href, note }: StatCardProps) {
    const content = (
        <>
            <span className="flex items-start justify-between gap-4 text-sm text-muted-foreground">
                {label}
                <Icon aria-hidden className="size-6 shrink-0" />
            </span>
            <span className="text-4xl font-bold text-foreground">{value}</span>
            {note && <span className="text-sm text-muted-foreground">{note}</span>}
        </>
    )

    if (!href) return <div className={CARD_CLASS}>{content}</div>

    return (
        <Link
            href={href}
            className={cn(
                CARD_CLASS,
                "transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            )}
        >
            {content}
        </Link>
    )
}
