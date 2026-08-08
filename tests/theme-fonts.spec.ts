import { expect, test } from "@playwright/test"
import { getSiteThemeFonts } from "@/lib/theme/get-site-theme"
import { resolveThemeFonts } from "@/lib/theme/fonts"

test.describe("semantic theme fonts", () => {
    test("does not require a database to provide fallback fonts", async () => {
        const databaseUrl = process.env.DATABASE_URL
        delete process.env.DATABASE_URL

        try {
            await expect(getSiteThemeFonts()).resolves.toBeNull()
        } finally {
            if (databaseUrl) {
                process.env.DATABASE_URL = databaseUrl
            }
        }
    })

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
