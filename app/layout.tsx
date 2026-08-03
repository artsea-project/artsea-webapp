import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
    weight: ["400", "700"],
})

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
    title: "Artsea Portfolio",
    description: "Artsea Web Application",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="pl">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} antialiased min-h-screen flex flex-col justify-between`}
            >
                <Header />
                <main className="flex-grow">{children}</main>
            </body>
        </html>
    )
}
