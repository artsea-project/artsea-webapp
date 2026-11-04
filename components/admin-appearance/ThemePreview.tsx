import type { CSSProperties, ReactNode } from "react"

import { getFontVariableClasses } from "@/app/fonts"
import type { ThemeDraft } from "@/lib/appearance/theme-editor-state"
import { resolveSiteTheme } from "@/lib/theme/theme"
import { cn } from "@/lib/utils"

/**
 * Renders its children with an unsaved theme, the same way the root layout applies the saved one:
 * the next/font classes and the --site-font-* and base color variables sit on one element, and
 * the .theme-preview class recomputes the derived colors from those base colors.
 */
export function ThemeScope({
    theme,
    className,
    children,
}: {
    theme: ThemeDraft
    className?: string
    children: ReactNode
}) {
    const resolved = resolveSiteTheme(theme)

    return (
        <div
            className={cn(
                "theme-preview bg-background text-foreground",
                getFontVariableClasses(resolved.fontNames),
                className
            )}
            style={resolved.variables as CSSProperties}
        >
            {children}
        </div>
    )
}

export function ThemePreview({ draft }: { draft: ThemeDraft }) {
    return (
        <ThemeScope theme={draft} className="flex flex-col gap-3 rounded-lg border p-5">
            <p className="font-primary text-2xl leading-tight">Wybrane prace.</p>
            <p className="flex gap-4 font-secondary text-sm text-muted-foreground">
                <span>O MNIE</span>
                <span>PORTFOLIO</span>
                <span>KONTAKT</span>
            </p>
            <p className="font-body text-sm">
                Źdźbło trawy na łące: tak wygląda główny tekst strony.
            </p>
            <span className="w-fit rounded-full bg-primary px-3 py-1 font-secondary text-xs text-primary-foreground">
                Akcent
            </span>
        </ThemeScope>
    )
}
