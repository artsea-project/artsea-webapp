export interface SiteThemeFonts {
    primaryFont: string // "Czcionka podstawowa" - Used for headings, brand logo, etc. (Default: 'Playfair Display')
    secondaryFont: string // "Czcionka pomocnicza" - Used for navigation items, secondary text, accents (Default: 'Inter')
    additionalFont: string // "Czcionka dodatkowa" - Used for main body text (Default: 'Inter')
}

export interface SiteThemeColors {
    foregroundColor: string // Main text and inverted section backgrounds
    backgroundColor: string // Page background and inverted section text
    accentColor: string // Emphasized text and primary actions (shadcn primary)
}

/**
 * Custom site theme configuration as defined by the "Czionki i kolory" (Fonts and Colors)
 * settings in the Figma Admin Dashboard layout panel.
 */
export interface SiteTheme {
    fonts: SiteThemeFonts
    colors: SiteThemeColors
    presetTheme: "default" | "dark" | "default_green" // "Motywy domyślne" (Default, Dark, and Default Green)
    darkModeExperimental: boolean // "Ciemny motyw (eksperymentalny)"
}
