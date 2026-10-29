import { X } from "lucide-react"

interface TagPillProps {
    namePln: string | null
    nameEng: string | null
    disabled?: boolean
    onDelete: () => void
}

export default function TagPill({ namePln, nameEng, disabled = false, onDelete }: TagPillProps) {
    const primaryLabel = namePln || nameEng || ""
    const secondaryLabel =
        namePln && nameEng && namePln.toLowerCase() !== nameEng.toLowerCase() ? nameEng : null

    return (
        <span className="inline-flex h-14 items-center gap-2 rounded-full border border-border bg-muted px-4.5 py-2.5 text-foreground">
            <span className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-sm leading-tight font-semibold text-foreground">
                    #{primaryLabel}
                </span>
                {secondaryLabel && (
                    <span className="text-[11px] leading-tight font-normal text-muted-foreground">
                        #{secondaryLabel}
                    </span>
                )}
            </span>
            <button
                type="button"
                disabled={disabled}
                aria-label={`Usuń tag ${primaryLabel}`}
                onClick={onDelete}
                className="inline-flex items-center justify-center rounded-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
                <X className="size-3.5" />
            </button>
        </span>
    )
}
