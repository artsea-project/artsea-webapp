import { readFile } from "node:fs/promises"
import path from "node:path"
import tailwindcss from "@tailwindcss/postcss"
import { expect, test, type Page } from "@playwright/test"
import postcss from "postcss"
import type { SiteThemeColors } from "@/types/theme"
import { defaultThemeColors, resolveThemeColors } from "@/lib/theme/colors"

let css: string

test.beforeAll(async () => {
    const stylesheet = path.resolve("app/globals.css")
    const result = await postcss([tailwindcss()]).process(await readFile(stylesheet, "utf8"), {
        from: stylesheet,
    })
    css = result.css
})

async function renderStylesheet(page: Page) {
    await page.setContent(`<style>${css}</style><div id="actual"></div><div id="expected"></div>`)
}

// Let the browser normalize hex and OKLab expressions before comparing colors.
async function expectVariable(page: Page, variable: string, color: string) {
    await page.locator("#actual").evaluate((element, variable) => {
        element.setAttribute("style", `background-color: var(--${variable})`)
    }, variable)
    const expected = await page.locator("#expected").evaluate((element, color) => {
        const style = (element as HTMLElement).style
        style.backgroundColor = color
        return getComputedStyle(element).backgroundColor
    }, color)
    await expect(page.locator("#actual")).toHaveCSS("background-color", expected)
}

function expectedTokens({
    foregroundColor: foreground,
    backgroundColor: background,
    accentColor: primary,
}: SiteThemeColors) {
    const muted = `color-mix(in oklab, ${background}, ${foreground} 5%)`
    const mutedForeground = `color-mix(in oklab, ${foreground} 70%, ${background})`
    const accent = `color-mix(in oklab, ${primary} 12%, ${background})`
    const border = `color-mix(in oklab, ${background}, ${foreground} 20%)`
    return {
        foreground,
        background,
        primary,
        "primary-foreground": background,
        "muted-foreground": mutedForeground,
        muted,
        secondary: muted,
        "secondary-foreground": foreground,
        accent,
        "accent-foreground": foreground,
        border,
        input: border,
        ring: primary,
        card: background,
        "card-foreground": foreground,
        popover: background,
        "popover-foreground": foreground,
        sidebar: muted,
        "sidebar-foreground": foreground,
        "sidebar-primary": primary,
        "sidebar-primary-foreground": background,
        "sidebar-accent": accent,
        "sidebar-accent-foreground": foreground,
        "sidebar-border": border,
        "sidebar-ring": primary,
        "chart-1": primary,
        "chart-2": foreground,
        "chart-3": mutedForeground,
        "chart-4": `color-mix(in oklab, ${primary}, ${background} 35%)`,
        "chart-5": `color-mix(in oklab, ${primary}, ${foreground} 35%)`,
        destructive: "#DC2626",
        "destructive-foreground": "#FFFFFF",
    }
}

const palettes = {
    light: defaultThemeColors,
    dark: { foregroundColor: "#EEEEEE", backgroundColor: "#111111", accentColor: "#8BB7F0" },
}

test("CSS defaults match the fallback database colors", async ({ page }) => {
    await renderStylesheet(page)
    for (const [variable, color] of Object.entries(expectedTokens(defaultThemeColors))) {
        await test.step(variable, () => expectVariable(page, variable, color))
    }
})

test("derived tokens update when the database palette changes", async ({ page }) => {
    await renderStylesheet(page)
    for (const [name, palette] of Object.entries(palettes)) {
        await test.step(name, async () => {
            await page.evaluate((variables) => {
                for (const [name, value] of Object.entries(variables)) {
                    document.documentElement.style.setProperty(name, value)
                }
            }, resolveThemeColors(palette))
            // A dark class must not introduce a competing fixed palette.
            await page
                .locator("html")
                .evaluate(
                    (element, dark) => element.classList.toggle("dark", dark),
                    name === "dark"
                )
            for (const [variable, color] of Object.entries(expectedTokens(palette))) {
                await test.step(variable, () => expectVariable(page, variable, color))
            }
        })
    }
})
