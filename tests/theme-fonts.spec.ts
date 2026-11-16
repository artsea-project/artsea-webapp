import { expect, test } from "@playwright/test"
import { isSelectableFontName, resolveThemeFonts, selectableFontNames } from "@/lib/theme/fonts"

test.describe("semantic theme fonts", () => {
    test("uses portfolio defaults when settings are unavailable", () => {
        expect(resolveThemeFonts(null)).toEqual({
            fontNames: ["Playfair Display", "Inter", "Geist Mono"],
            variables: {
                "--site-font-primary":
                    'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
                "--site-font-secondary": "var(--font-inter, Arial, Helvetica, sans-serif)",
                "--site-font-body": "var(--font-inter, Arial, Helvetica, sans-serif)",
                "--site-font-mono":
                    "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
            },
        })
    })

    test("maps database selections to semantic font roles", () => {
        const resolved = resolveThemeFonts({
            primaryFont: "Inter",
            secondaryFont: "Playfair Display",
            additionalFont: "Playfair Display",
        })

        expect(resolved.variables).toEqual({
            "--site-font-primary": "var(--font-inter, Arial, Helvetica, sans-serif)",
            "--site-font-secondary":
                'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
            "--site-font-body": 'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
            "--site-font-mono":
                "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
        })
    })

    test("offers every catalog font to pick, serif first, without the monospace font", () => {
        expect(selectableFontNames).toEqual([
            "Playfair Display",
            "Lora",
            "Cormorant Garamond",
            "Libre Baskerville",
            "Inter",
            "Poppins",
            "Lato",
            "Montserrat",
        ])
    })

    test("accepts the serif fonts added to the catalog", () => {
        const resolved = resolveThemeFonts({
            primaryFont: "Cormorant Garamond",
            secondaryFont: "Libre Baskerville",
            additionalFont: "Lora",
        })

        expect(resolved.fontNames).toEqual([
            "Cormorant Garamond",
            "Libre Baskerville",
            "Lora",
            "Geist Mono",
        ])
        expect(resolved.variables["--site-font-primary"]).toContain("--font-cormorant-garamond")
        expect(resolved.variables["--site-font-secondary"]).toContain("--font-libre-baskerville")
        expect(resolved.variables["--site-font-body"]).toContain("--font-lora")
    })

    test("accepts the sans-serif fonts added to the catalog", () => {
        const resolved = resolveThemeFonts({
            primaryFont: "Montserrat",
            secondaryFont: "Poppins",
            additionalFont: "Lato",
        })

        expect(resolved.fontNames).toEqual(["Montserrat", "Poppins", "Lato", "Geist Mono"])
        expect(resolved.variables["--site-font-primary"]).toContain("--font-montserrat")
        expect(resolved.variables["--site-font-secondary"]).toContain("--font-poppins")
        expect(resolved.variables["--site-font-body"]).toContain("--font-lato")
    })

    test("recognises only the fonts the artist can pick", () => {
        expect(isSelectableFontName("Playfair Display")).toBe(true)
        expect(isSelectableFontName("Inter")).toBe(true)
        expect(isSelectableFontName("Geist Mono")).toBe(false)
        expect(isSelectableFontName("inter")).toBe(false)
        expect(isSelectableFontName("Unknown Font")).toBe(false)
        expect(isSelectableFontName(null)).toBe(false)
    })

    test("falls back safely for unknown database values", () => {
        const resolved = resolveThemeFonts({
            primaryFont: "Unknown Font",
            secondaryFont: "inter",
            additionalFont: "playfair-display",
        })

        expect(resolved.fontNames).toEqual(["Playfair Display", "Inter", "Geist Mono"])
        expect(resolved.variables["--site-font-primary"]).toContain("--font-playfair-display")
        expect(resolved.variables["--site-font-secondary"]).toContain("--font-inter")
        expect(resolved.variables["--site-font-body"]).toContain("--font-inter")
        expect(resolved.variables["--site-font-mono"]).toContain("--font-geist-mono")
    })
})
