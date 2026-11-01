import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface TagPillProps {
    namePln: string | null
    nameEng: string | null
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
    const primaryLabel = namePln || nameEng || ""
    const secondaryLabel =
        namePln && nameEng && namePln.toLowerCase() !== nameEng.toLowerCase() ? nameEng : null

    return (
        <span
            className={cn(
                "inline-flex h-14 max-w-full items-center gap-2 rounded-full border border-border bg-muted px-4.5 py-2.5 text-foreground transition-colors",
                isSelected && "border-primary ring-1 ring-primary"
            )}
        >
            <button
                type="button"
                onClick={onSelect}
                aria-label={`Edytuj tag ${primaryLabel}`}
                className="flex min-w-0 cursor-pointer flex-col items-center gap-0.5 text-center transition-opacity hover:opacity-75 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
                <span className="max-w-full truncate text-sm leading-tight font-semibold text-foreground">
                    #{primaryLabel}
                </span>
                {secondaryLabel && (
                    <span className="max-w-full truncate text-[11px] leading-tight font-normal text-muted-foreground">
                        #{secondaryLabel}
                    </span>
                )}
            </button>
            <button
                type="button"
                disabled={disabled}
                aria-label={`Usuń tag ${primaryLabel}`}
                onClick={onDelete}
                className="inline-flex shrink-0 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
                <X className="size-3.5" />
            </button>
        </span>
    )
}
