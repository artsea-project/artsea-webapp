export interface SiteThemeFonts {
  primaryFont: string;       // "Czcionka podstawowa" - Used for headings, brand logo, etc. (Default: 'Playfair Display')
  secondaryFont: string;     // "Czcionka pomocnicza" - Used for navigation items, secondary text, accents (Default: 'Inter')
  additionalFont: string;    // "Czcionka dodatkowa" - Used for main body text (Default: 'Inter')
}

export interface SiteThemeColors {
  primaryColor: string;      // "Kolor główny" - Used for headings, brand logo, etc. (Default: #292524)
  secondaryColor: string;    // "Kolor pomocniczy" - Used for secondary text and accents (Default: #A8A29E)
  additionalColor: string;   // "Kolor dodatkowy" - Used for main body text (Default: #1C1917)
  accentColor: string;       // "Kolor akcentów" - Accent color highlights (Default: #A8A29E)
  backgroundColor: string;   // "Kolor tła" - Page background (Default: #FFFFFF)
}

/**
 * Custom site theme configuration as defined by the "Czionki i kolory" (Fonts and Colors) 
 * settings in the Figma Admin Dashboard layout panel.
 */
export interface SiteTheme {
  fonts: SiteThemeFonts;
  colors: SiteThemeColors;
  presetTheme: 'domyslny' | 'ciemny' | 'domyslny_zielen'; // "Motywy domyślne" (Default, Dark, and Default Green)
  darkModeExperimental: boolean; // "Ciemny motyw (eksperymentalny)"
}
