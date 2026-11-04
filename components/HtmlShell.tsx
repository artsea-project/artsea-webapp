import type { CSSProperties, ReactNode } from "react"
import { getFontVariableClasses } from "@/app/fonts"
import { cn } from "@/lib/utils"
import { getSiteTheme } from "@/lib/theme/get-site-theme"
import { resolveSiteTheme, type ThemeVariables } from "@/lib/theme/theme"
import "@/app/globals.css"

type ThemeStyle = CSSProperties & ThemeVariables

interface HtmlShellProps {
    lang: string
    /** Extra classes for <html>, merged with the font classes. */
    className?: string
    children: ReactNode
}

export default async function HtmlShell({ lang, className, children }: HtmlShellProps) {
    const theme = await getSiteTheme()
    const resolvedTheme = resolveSiteTheme(theme)
    const fontClasses = getFontVariableClasses(resolvedTheme.fontNames)

    // The next/font classes and the --site-font-* variables must stay on the same element:
    // next/font only declares its variables on the element carrying its generated className,
    // and a nested var() resolves against the scope where the outer variable is declared.
    return (
        <html
            lang={lang}
            className={cn(fontClasses, className)}
            style={resolvedTheme.variables as ThemeStyle}
        >
            <body className="font-body antialiased">{children}</body>
        </html>
    )
}
