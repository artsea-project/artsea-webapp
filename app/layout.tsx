import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { getFontVariableClasses } from "@/app/fonts"
import { getSiteThemeFonts } from "@/lib/theme/get-site-theme"
import { resolveThemeFonts, type ThemeFontVariables } from "@/lib/theme/fonts"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

type ThemeStyle = CSSProperties & ThemeFontVariables

export const metadata: Metadata = {
    title: "Artsea Portfolio",
    description: "Artsea Web Application",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const themeFonts = await getSiteThemeFonts()
    const resolvedFonts = resolveThemeFonts(themeFonts)
    const fontClasses = getFontVariableClasses(resolvedFonts.fontNames)

    return (
        <html lang="pl" className={fontClasses} style={resolvedFonts.variables as ThemeStyle}>
            <body className="font-body antialiased min-h-screen flex flex-col justify-between">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
            </body>
        </html>
    )
}
