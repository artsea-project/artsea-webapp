import {
    Bodoni_Moda,
    Bricolage_Grotesque,
    Cinzel,
    Cormorant_Garamond,
    DM_Sans,
    EB_Garamond,
    Fraunces,
    Geist_Mono,
    Inter,
    Lato,
    Libre_Baskerville,
    Lora,
    Merriweather,
    Montserrat,
    Nunito,
    Open_Sans,
    Playfair_Display,
    Poppins,
    Raleway,
    Roboto,
    Source_Serif_4,
    Space_Grotesk,
    Spectral,
    Syne,
    Unbounded,
    Work_Sans,
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

const fraunces = Fraunces({
    variable: "--font-fraunces",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const spectral = Spectral({
    variable: "--font-spectral",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const bodoniModa = Bodoni_Moda({
    variable: "--font-bodoni-moda",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const cinzel = Cinzel({
    variable: "--font-cinzel",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const ebGaramond = EB_Garamond({
    variable: "--font-eb-garamond",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const merriweather = Merriweather({
    variable: "--font-merriweather",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Georgia", "Times New Roman", "serif"],
    preload: false,
})

const sourceSerif4 = Source_Serif_4({
    variable: "--font-source-serif-4",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
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

const syne = Syne({
    variable: "--font-syne",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const unbounded = Unbounded({
    variable: "--font-unbounded",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const bricolageGrotesque = Bricolage_Grotesque({
    variable: "--font-bricolage-grotesque",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const roboto = Roboto({
    variable: "--font-roboto",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const openSans = Open_Sans({
    variable: "--font-open-sans",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const workSans = Work_Sans({
    variable: "--font-work-sans",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const raleway = Raleway({
    variable: "--font-raleway",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
    fallback: ["Arial", "Helvetica", "sans-serif"],
    preload: false,
})

const nunito = Nunito({
    variable: "--font-nunito",
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
    Fraunces: fraunces,
    Spectral: spectral,
    "Bodoni Moda": bodoniModa,
    Cinzel: cinzel,
    "EB Garamond": ebGaramond,
    Merriweather: merriweather,
    "Source Serif 4": sourceSerif4,
    Inter: inter,
    Poppins: poppins,
    Lato: lato,
    Montserrat: montserrat,
    Syne: syne,
    "Space Grotesk": spaceGrotesk,
    Unbounded: unbounded,
    "Bricolage Grotesque": bricolageGrotesque,
    Roboto: roboto,
    "Open Sans": openSans,
    "DM Sans": dmSans,
    "Work Sans": workSans,
    Raleway: raleway,
    Nunito: nunito,
    "Geist Mono": geistMono,
}

export const adminFontClassName = inter.className

export function getFontVariableClasses(fontNames: readonly FontName[]): string {
    return fontNames.map((fontName) => fontsByName[fontName].variable).join(" ")
}

export function getFontClassName(fontName: FontName): string {
    return fontsByName[fontName].className
}
