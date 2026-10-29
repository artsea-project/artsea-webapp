"use client"

import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExpandToggleProps {
    expanded: boolean
    hiddenCount: number
    controlsId: string
    onToggle: () => void
}

export default function ExpandToggle({
    expanded,
    hiddenCount,
    controlsId,
    onToggle,
}: ExpandToggleProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            aria-expanded={expanded}
            aria-controls={controlsId}
            onClick={onToggle}
            className="h-11 w-full rounded-none text-sm font-normal text-muted-foreground"
        >
            {expanded ? "Zwiń" : `Pokaż wszystkie (+${hiddenCount})`}
            <ChevronDown className={cn("transition-transform", expanded && "rotate-180")} />
        </Button>
    )
}
