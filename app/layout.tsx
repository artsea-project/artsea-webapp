import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { getFontVariableClasses } from "@/app/fonts"
import { getSiteTheme } from "@/lib/theme/get-site-theme"
import { resolveSiteTheme, type ThemeVariables } from "@/lib/theme/theme"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

type ThemeStyle = CSSProperties & ThemeVariables

export const metadata: Metadata = {
    title: "Artsea Portfolio",
    description: "Artsea Web Application",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const theme = await getSiteTheme()
    const resolvedTheme = resolveSiteTheme(theme)
    const fontClasses = getFontVariableClasses(resolvedTheme.fontNames)

    return (
        <html lang="pl" className={fontClasses} style={resolvedTheme.variables as ThemeStyle}>
            <body className="font-body antialiased min-h-screen flex flex-col justify-between">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
            </body>
        </html>
    )
}
