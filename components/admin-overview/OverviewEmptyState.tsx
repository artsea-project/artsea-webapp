import Link from "next/link"

import { OVERVIEW_CARD_CLASS } from "@/components/admin-overview/card-styles"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OverviewEmptyStateProps {
    message: string
    actionLabel: string
    href: string
}

export default function OverviewEmptyState({
    message,
    actionLabel,
    href,
}: OverviewEmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-start gap-4", OVERVIEW_CARD_CLASS)}>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button asChild variant="outline" size="sm">
                <Link href={href}>{actionLabel}</Link>
            </Button>
        </div>
    )
}
