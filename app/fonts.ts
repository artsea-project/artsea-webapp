import {
    Cormorant_Garamond,
    Geist_Mono,
    Inter,
    Lato,
    Libre_Baskerville,
    Lora,
    Montserrat,
    Playfair_Display,
    Poppins,
} from "next/font/google"
import type { FontName } from "@/lib/theme/fonts"

// next/font only accepts literal options, so every font repeats its settings. The theme fonts are
// chosen in the admin panel, so none of them is preloaded: a page downloads only the fonts its
// CSS actually uses.

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

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const lato = Lato({
    variable: "--font-lato",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const montserrat = Montserrat({
    variable: "--font-montserrat",
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
    Poppins: poppins.variable,
    Lato: lato.variable,
    Montserrat: montserrat.variable,
    "Geist Mono": geistMono.variable,
}

export function getFontVariableClasses(fontNames: readonly FontName[]): string {
    return fontNames.map((fontName) => fontVariableClasses[fontName]).join(" ")
}
