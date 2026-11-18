import { cn } from "@/lib/utils"

interface VisibilitySwitchProps {
    checked: boolean
    label: string
    ariaLabel: string
    disabled?: boolean
    onToggle: () => void
    className?: string
}

/** Accessible pill switch matching the admin work card visibility toggle. */
export default function VisibilitySwitch({
    checked,
    label,
    ariaLabel,
    disabled = false,
    onToggle,
    className,
}: VisibilitySwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onToggle}
            className={cn(
                "group inline-flex shrink-0 items-center gap-2.5 text-xs font-medium disabled:pointer-events-none disabled:opacity-50",
                className
            )}
        >
            <span
                className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
                    checked ? "bg-foreground" : "bg-muted-foreground/25"
                )}
            >
                <span
                    className={cn(
                        "size-4 rounded-full bg-background shadow-xs transition-transform",
                        checked ? "translate-x-4" : "translate-x-0"
                    )}
                />
            </span>
            <span className={cn(checked ? "text-foreground" : "text-muted-foreground")}>
                {label}
            </span>
        </button>
    )
}
