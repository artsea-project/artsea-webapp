import { expect, test } from "@playwright/test"
import { getSiteTheme } from "@/lib/theme/get-site-theme"
import { defaultThemeColors, resolveThemeColors } from "@/lib/theme/colors"
import { resolveSiteTheme } from "@/lib/theme/theme"

const palette = { foregroundColor: "#1C1917", backgroundColor: "#FFFFFF", accentColor: "#57534E" }

test("does not require a database to provide the fallback theme", async () => {
    const databaseUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    try {
        await expect(getSiteTheme()).resolves.toBeNull()
    } finally {
        if (databaseUrl) process.env.DATABASE_URL = databaseUrl
    }
})

test("resolves fonts and the three-color palette together", () => {
    const resolved = resolveSiteTheme({
        fonts: { primaryFont: "Inter", secondaryFont: "Playfair Display", additionalFont: "Inter" },
        colors: palette,
    })
    expect(resolved.fontNames).toEqual(["Inter", "Playfair Display", "Geist Mono"])
    expect(resolved.variables).toEqual({
        "--site-font-primary": "var(--font-inter, Arial, Helvetica, sans-serif)",
        "--site-font-secondary": 'var(--font-playfair-display, Georgia, "Times New Roman", serif)',
        "--site-font-body": "var(--font-inter, Arial, Helvetica, sans-serif)",
        "--site-font-mono":
            "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
        "--foreground": "#1C1917",
        "--background": "#FFFFFF",
        "--primary": "#57534E",
    })
})

test("falls back field by field for malformed values, not low contrast", () => {
    expect(
        resolveThemeColors({
            foregroundColor: null,
            backgroundColor: "red; background: url(example)",
            accentColor: "#abc",
        })
    ).toMatchObject({
        "--foreground": defaultThemeColors.foregroundColor,
        "--background": defaultThemeColors.backgroundColor,
        "--primary": "#abc",
    })
    const resolved = resolveSiteTheme({
        colors: { foregroundColor: "#fff", backgroundColor: "#fff", accentColor: "#fff" },
    })
    expect(resolved.variables).toMatchObject({
        "--foreground": "#fff",
        "--background": "#fff",
        "--primary": "#fff",
    })
})

for (const color of ["#abc0", "#abcd", "#1C191700", "#FFFFFF00", "#12345678"]) {
    test(`rejects alpha hex color ${color}`, () => {
        expect(
            resolveThemeColors({
                foregroundColor: color,
                backgroundColor: color,
                accentColor: color,
            })
        ).toEqual(resolveThemeColors(defaultThemeColors))
    })
}
for (const color of ["#abc", "#ABC", "#123456", "#aAbBcC"]) {
    test(`preserves opaque database color ${color}`, () => {
        expect(
            resolveThemeColors({
                foregroundColor: color,
                backgroundColor: color,
                accentColor: color,
            })
        ).toMatchObject({ "--foreground": color, "--background": color, "--primary": color })
    })
}
