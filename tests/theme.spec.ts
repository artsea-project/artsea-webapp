import { expect, test } from "@playwright/test"
import { getSiteTheme } from "@/lib/theme/get-site-theme"
import { resolveSiteTheme } from "@/lib/theme/theme"

test.describe("semantic site theme", () => {
    test("does not require a database to provide the fallback theme", async () => {
        const databaseUrl = process.env.DATABASE_URL
        delete process.env.DATABASE_URL

        try {
            await expect(getSiteTheme()).resolves.toBeNull()
        } finally {
            if (databaseUrl) {
                process.env.DATABASE_URL = databaseUrl
            }
        }
    })

    test("resolves database fonts and standardized color roles together", () => {
        const resolved = resolveSiteTheme({
            fonts: {
                primaryFont: "Inter",
                secondaryFont: "Playfair Display",
                additionalFont: "Playfair Display",
            },
            colors: {
                primaryColor: "#112233",
                secondaryColor: "#445566",
                foregroundColor: "#778899",
                accentColor: "#AABBCC",
                backgroundColor: "#FDFCFB",
            },
            presetTheme: "default",
            darkModeExperimental: false,
        })

        expect(resolved.fontNames).toEqual(["Inter", "Playfair Display", "Geist Mono"])
        expect(resolved.variables).toEqual({
            "--site-font-primary": "var(--font-inter, Arial, Helvetica, sans-serif)",
            "--site-font-secondary":
                'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
            "--site-font-body": 'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
            "--site-font-mono":
                "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
            "--primary": "#112233",
            "--secondary": "#445566",
            "--foreground": "#778899",
            "--accent": "#AABBCC",
            "--background": "#FDFCFB",
        })
    })

    test("falls back field by field when persisted theme values are invalid", () => {
        const resolved = resolveSiteTheme({
            fonts: {
                primaryFont: "Unknown Font",
                secondaryFont: "Inter",
                additionalFont: "Inter",
            },
            colors: {
                primaryColor: "red; background: url(example)",
                secondaryColor: "#abc",
                foregroundColor: null,
                accentColor: "not-a-color",
                backgroundColor: "#12345678",
            },
        })

        expect(resolved.variables).toMatchObject({
            "--site-font-primary":
                'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
            "--site-font-secondary": "var(--font-inter, Arial, Helvetica, sans-serif)",
            "--site-font-body": "var(--font-inter, Arial, Helvetica, sans-serif)",
            "--primary": "#292524",
            "--secondary": "#abc",
            "--foreground": "#1C1917",
            "--accent": "#A8A29E",
            "--background": "#12345678",
        })
    })
})
