import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
    label: string
    value: number
    icon: LucideIcon
    href: string
}

export default function StatCard({ label, value, icon: Icon, href }: StatCardProps) {
    return (
        <Link
            href={href}
            className="flex flex-col gap-2 rounded-lg border border-border bg-background p-6 transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
            <span className="flex items-start justify-between gap-4 text-sm text-muted-foreground">
                {label}
                <Icon aria-hidden className="size-6 shrink-0" />
            </span>
            <span className="text-4xl font-bold text-foreground">{value}</span>
        </Link>
    )
}
