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
    "Geist Mono": {
        category: "monospace",
        family: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
    },
} as const satisfies Record<string, { category: FontCategory; family: string }>

export type FontName = keyof typeof fontCatalog

/** Fonts the admin can pick for the site theme, in catalog order (serif first). */
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

function isFontName(value: unknown): value is FontName {
    return typeof value === "string" && Object.hasOwn(fontCatalog, value)
}

function resolveFontName(value: unknown, fallback: FontName): FontName {
    return isFontName(value) ? value : fallback
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
