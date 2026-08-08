import type { SiteThemeFonts } from "@/types/theme"

export const fontCatalog = {
    "Playfair Display": {
        family: 'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
    },
    Inter: {
        family: "var(--font-inter, Arial, Helvetica, sans-serif)",
    },
    "Geist Mono": {
        family: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
    },
} as const

export type FontName = keyof typeof fontCatalog

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
