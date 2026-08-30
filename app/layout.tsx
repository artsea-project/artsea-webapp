import type { CSSProperties, ReactNode } from "react"
import { getFontVariableClasses } from "@/app/fonts"
import { getSiteThemeFonts } from "@/lib/theme/get-site-theme"
import { resolveThemeFonts, type ThemeFontVariables } from "@/lib/theme/fonts"
import "./globals.css"

type ThemeStyle = CSSProperties & ThemeFontVariables

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    const themeFonts = await getSiteThemeFonts()
    const resolvedFonts = resolveThemeFonts(themeFonts)
    const fontClasses = getFontVariableClasses(resolvedFonts.fontNames)

    // The next/font classes and the --site-font-* variables must stay on the same element:
    // next/font only declares its variables on the element carrying its generated className,
    // and a nested var() resolves against the scope where the outer variable is declared.
    return (
        <html lang="pl" className={fontClasses} style={resolvedFonts.variables as ThemeStyle}>
            <body className="font-body antialiased">{children}</body>
        </html>
    )
}
