import Link from "next/link"
import { Folder, Hash, Image as ImageIcon, type LucideIcon } from "lucide-react"

import { OVERVIEW_CARD_LINK_CLASSES } from "@/components/admin-overview/OverviewPanel"
import type { OverviewStats } from "@/lib/admin-overview/queries"
import { cn } from "@/lib/utils"

interface StatCardProps {
    label: string
    value: number
    href: string
    icon: LucideIcon
}

function StatCard({ label, value, href, icon: Icon }: StatCardProps) {
    return (
        <Link
            href={href}
            className={cn(OVERVIEW_CARD_LINK_CLASSES, "flex flex-col gap-3 px-6 pt-5 pb-7")}
        >
            <span className="flex items-start justify-between gap-3 text-sm text-muted-foreground">
                {label}
                <Icon className="size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="text-4xl font-bold text-foreground">{value}</span>
        </Link>
    )
}

export default function OverviewStatCards({ stats }: { stats: OverviewStats }) {
    const cards: StatCardProps[] = [
        { label: "Dodane prace", value: stats.works, href: "/admin/works", icon: ImageIcon },
        {
            label: "Aktywne kategorie",
            value: stats.activeCategories,
            href: "/admin/categories",
            icon: Folder,
        },
        { label: "Zdefiniowane tagi", value: stats.tags, href: "/admin/categories", icon: Hash },
    ]

    return (
        <ul className="grid gap-6 md:grid-cols-3">
            {cards.map((card) => (
                <li key={card.label}>
                    <StatCard {...card} />
                </li>
            ))}
        </ul>
    )
}
