import type { CSSProperties, ReactNode } from "react"

import { getFontVariableClasses } from "@/app/fonts"
import { resolveThemeFonts, type ThemeFontVariables } from "@/lib/theme/fonts"
import { getSiteThemeFonts } from "@/lib/theme/get-site-theme"
import "@/app/globals.css"

type ThemeStyle = CSSProperties & ThemeFontVariables

export default async function HtmlShell({
    bodyClassName,
    children,
}: {
    bodyClassName: string
    children: ReactNode
}) {
    const themeFonts = await getSiteThemeFonts()
    const resolvedFonts = resolveThemeFonts(themeFonts)
    const fontClasses = getFontVariableClasses(resolvedFonts.fontNames)

    return (
        <html lang="pl" className={fontClasses} style={resolvedFonts.variables as ThemeStyle}>
            <body className={bodyClassName}>{children}</body>
        </html>
    )
}
