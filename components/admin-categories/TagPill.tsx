import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TagPillProps {
    namePln: string
    nameEng: string
    isSelected?: boolean
    disabled?: boolean
    onSelect?: () => void
    onDelete: () => void
}

export default function TagPill({
    namePln,
    nameEng,
    isSelected = false,
    disabled = false,
    onSelect,
    onDelete,
}: TagPillProps) {
    const secondaryLabel = namePln.toLowerCase() !== nameEng.toLowerCase() ? nameEng : null

    return (
        <span
            className={cn(
                "inline-flex h-14 max-w-full items-center gap-2 rounded-full border border-border bg-muted px-4.5 py-2.5 text-foreground transition-colors",
                isSelected && "border-primary ring-1 ring-primary"
            )}
        >
            <button
                type="button"
                disabled={disabled}
                onClick={onSelect}
                aria-label={`Edytuj tag ${namePln}`}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-0.5 text-center transition-opacity hover:opacity-75 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
                <span className="max-w-full truncate text-sm leading-tight font-semibold text-foreground">
                    #{namePln}
                </span>
                {secondaryLabel && (
                    <span className="max-w-full truncate text-[11px] leading-tight font-normal text-muted-foreground">
                        #{secondaryLabel}
                    </span>
                )}
            </button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Usuń tag ${namePln}`}
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive"
            >
                <X />
            </Button>
        </span>
    )
}
