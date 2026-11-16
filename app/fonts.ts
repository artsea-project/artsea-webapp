import {
    Cormorant_Garamond,
    Geist_Mono,
    Inter,
    Libre_Baskerville,
    Lora,
    Playfair_Display,
} from "next/font/google"
import type { FontName } from "@/lib/theme/fonts"

const playfairDisplay = Playfair_Display({
    variable: "--font-playfair-display",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const lora = Lora({
    variable: "--font-lora",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const cormorantGaramond = Cormorant_Garamond({
    variable: "--font-cormorant-garamond",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const libreBaskerville = Libre_Baskerville({
    variable: "--font-libre-baskerville",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
})

const fontVariableClasses: Record<FontName, string> = {
    "Playfair Display": playfairDisplay.variable,
    Lora: lora.variable,
    "Cormorant Garamond": cormorantGaramond.variable,
    "Libre Baskerville": libreBaskerville.variable,
    Inter: inter.variable,
    "Geist Mono": geistMono.variable,
}

export function getFontVariableClasses(fontNames: readonly FontName[]): string {
    return fontNames.map((fontName) => fontVariableClasses[fontName]).join(" ")
}
