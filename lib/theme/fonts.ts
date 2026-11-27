import type { SiteThemeFonts } from "@/types/theme"

export type FontCategory = "serif" | "sans-serif" | "monospace"

export const fontCatalog = {
    "Playfair Display": {
        category: "serif",
        family: 'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
    },
    Lora: {
        category: "serif",
        family: 'var(--font-lora, Georgia, "Times New Roman", serif)',
    },
    "Cormorant Garamond": {
        category: "serif",
        family: 'var(--font-cormorant-garamond, Georgia, "Times New Roman", serif)',
    },
    "Libre Baskerville": {
        category: "serif",
        family: 'var(--font-libre-baskerville, Georgia, "Times New Roman", serif)',
    },
    Fraunces: {
        category: "serif",
        family: 'var(--font-fraunces, Georgia, "Times New Roman", serif)',
    },
    Spectral: {
        category: "serif",
        family: 'var(--font-spectral, Georgia, "Times New Roman", serif)',
    },
    "Bodoni Moda": {
        category: "serif",
        family: 'var(--font-bodoni-moda, Georgia, "Times New Roman", serif)',
    },
    Cinzel: {
        category: "serif",
        family: 'var(--font-cinzel, Georgia, "Times New Roman", serif)',
    },
    "EB Garamond": {
        category: "serif",
        family: 'var(--font-eb-garamond, Georgia, "Times New Roman", serif)',
    },
    Merriweather: {
        category: "serif",
        family: 'var(--font-merriweather, Georgia, "Times New Roman", serif)',
    },
    "Source Serif 4": {
        category: "serif",
        family: 'var(--font-source-serif-4, Georgia, "Times New Roman", serif)',
    },
    Inter: {
        category: "sans-serif",
        family: "var(--font-inter, Arial, Helvetica, sans-serif)",
    },
    Poppins: {
        category: "sans-serif",
        family: "var(--font-poppins, Arial, Helvetica, sans-serif)",
    },
    Lato: {
        category: "sans-serif",
        family: "var(--font-lato, Arial, Helvetica, sans-serif)",
    },
    Montserrat: {
        category: "sans-serif",
        family: "var(--font-montserrat, Arial, Helvetica, sans-serif)",
    },
    Syne: {
        category: "sans-serif",
        family: "var(--font-syne, Arial, Helvetica, sans-serif)",
    },
    "Space Grotesk": {
        category: "sans-serif",
        family: "var(--font-space-grotesk, Arial, Helvetica, sans-serif)",
    },
    Unbounded: {
        category: "sans-serif",
        family: "var(--font-unbounded, Arial, Helvetica, sans-serif)",
    },
    "Bricolage Grotesque": {
        category: "sans-serif",
        family: "var(--font-bricolage-grotesque, Arial, Helvetica, sans-serif)",
    },
    Roboto: {
        category: "sans-serif",
        family: "var(--font-roboto, Arial, Helvetica, sans-serif)",
    },
    "Open Sans": {
        category: "sans-serif",
        family: "var(--font-open-sans, Arial, Helvetica, sans-serif)",
    },
    "DM Sans": {
        category: "sans-serif",
        family: "var(--font-dm-sans, Arial, Helvetica, sans-serif)",
    },
    "Work Sans": {
        category: "sans-serif",
        family: "var(--font-work-sans, Arial, Helvetica, sans-serif)",
    },
    Raleway: {
        category: "sans-serif",
        family: "var(--font-raleway, Arial, Helvetica, sans-serif)",
    },
    Nunito: {
        category: "sans-serif",
        family: "var(--font-nunito, Arial, Helvetica, sans-serif)",
    },
    "Geist Mono": {
        category: "monospace",
        family: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
    },
} as const satisfies Record<string, { category: FontCategory; family: string }>

export type FontName = keyof typeof fontCatalog

export const selectableFontNames: FontName[] = (Object.keys(fontCatalog) as FontName[]).filter(
    (name) => fontCatalog[name].category !== "monospace"
)

export function isSelectableFontName(value: unknown): value is FontName {
    return typeof value === "string" && (selectableFontNames as string[]).includes(value)
}

export const defaultThemeFonts = {
    primaryFont: "Playfair Display",
    secondaryFont: "Inter",
    additionalFont: "Inter",
} as const satisfies SiteThemeFonts

const defaultMonoFont = "Geist Mono" satisfies FontName

export type ThemeFontVariables = {
    "--site-font-primary": string
    "--site-font-secondary": string
    "--site-font-body": string
    "--site-font-mono": string
}

export interface ResolvedThemeFonts {
    fontNames: FontName[]
    variables: ThemeFontVariables
}

function resolveFontName(value: unknown, fallback: FontName): FontName {
    return isSelectableFontName(value) ? value : fallback
}

export function resolveThemeFonts(fonts?: Partial<SiteThemeFonts> | null): ResolvedThemeFonts {
    const primary = resolveFontName(fonts?.primaryFont, defaultThemeFonts.primaryFont)
    const secondary = resolveFontName(fonts?.secondaryFont, defaultThemeFonts.secondaryFont)
    const body = resolveFontName(fonts?.additionalFont, defaultThemeFonts.additionalFont)

    return {
        fontNames: [...new Set<FontName>([primary, secondary, body, defaultMonoFont])],
        variables: {
            "--site-font-primary": fontCatalog[primary].family,
            "--site-font-secondary": fontCatalog[secondary].family,
            "--site-font-body": fontCatalog[body].family,
            "--site-font-mono": fontCatalog[defaultMonoFont].family,
        },
    }
}
