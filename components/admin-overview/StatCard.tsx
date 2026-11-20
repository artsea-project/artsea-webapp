import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import {
    OVERVIEW_CARD_CLASS,
    OVERVIEW_CARD_LINK_CLASS,
} from "@/components/admin-overview/card-styles"
import { cn } from "@/lib/utils"

interface StatCardProps {
    label: string
    value: number
    icon: LucideIcon
    href: string
    note?: string | null
}

export default function StatCard({ label, value, icon: Icon, href, note }: StatCardProps) {
    return (
        <Link
            href={href}
            className={cn("flex flex-col gap-2", OVERVIEW_CARD_CLASS, OVERVIEW_CARD_LINK_CLASS)}
        >
            <span className="flex items-start justify-between gap-4 text-sm text-muted-foreground">
                {label}
                <Icon aria-hidden className="size-6 shrink-0" />
            </span>
            <span className="text-4xl font-bold text-foreground">{value}</span>
            {note && <span className="text-sm text-muted-foreground">{note}</span>}
        </Link>
    )
}
