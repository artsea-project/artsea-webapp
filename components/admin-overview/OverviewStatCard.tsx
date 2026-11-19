import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface OverviewStatCardProps {
    label: string
    value: number
    href: string
    icon: LucideIcon
}

/** Clickable summary stat card linking to the corresponding admin management section. */
export default function OverviewStatCard({
    label,
    value,
    href,
    icon: Icon,
}: OverviewStatCardProps) {
    return (
        <Link
            href={href}
            className="flex h-30 flex-col justify-between rounded-xl border border-border bg-background px-6 py-5 transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-normal text-muted-foreground">{label}</span>
                <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground/80" />
            </div>
            <span className="text-4xl leading-none font-bold text-foreground">{value}</span>
        </Link>
    )
}
