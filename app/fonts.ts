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

const playfairDisplay = Playfair_Display({
    variable: "--font-playfair-display",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
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

const fontsByName: Record<FontName, { variable: string; className: string }> = {
    "Playfair Display": playfairDisplay,
    Lora: lora,
    "Cormorant Garamond": cormorantGaramond,
    "Libre Baskerville": libreBaskerville,
    Inter: inter,
    Poppins: poppins,
    Lato: lato,
    Montserrat: montserrat,
    "Geist Mono": geistMono,
}

export const adminFontClassName = inter.className

export function getFontVariableClasses(fontNames: readonly FontName[]): string {
    return fontNames.map((fontName) => fontsByName[fontName].variable).join(" ")
}

export function getFontClassName(fontName: FontName): string {
    return fontsByName[fontName].className
}
