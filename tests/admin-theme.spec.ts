import { readFile } from "node:fs/promises"
import path from "node:path"
import tailwindcss from "@tailwindcss/postcss"
import { expect, test } from "@playwright/test"
import postcss from "postcss"
import AdminLayout from "@/app/admin/layout"
import { resolveThemeColors } from "@/lib/theme/colors"

const adminPalette = {
    foregroundColor: "#0f172a",
    backgroundColor: "#ffffff",
    accentColor: "#0284c7",
}

const tokens = [
    "background",
    "foreground",
    "primary",
    "primary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "secondary",
    "secondary-foreground",
    "border",
    "input",
    "ring",
    "destructive",
    "destructive-foreground",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
    "sidebar",
    "sidebar-foreground",
    "sidebar-primary",
    "sidebar-primary-foreground",
    "sidebar-accent",
    "sidebar-accent-foreground",
    "sidebar-border",
    "sidebar-ring",
]

test("admin uses the shared formulas with a fixed palette independent of public colors", async ({
    page,
}) => {
    const stylesheet = path.resolve("app/globals.css")
    const { css } = await postcss([tailwindcss()]).process(await readFile(stylesheet, "utf8"), {
        from: stylesheet,
    })
    const layout = AdminLayout({ children: null })
    await page.setContent(`
        <style>${css}</style>
        <div id="public"></div>
        <section id="admin" class="${layout.props.className}">
            <p id="admin-text">Admin content</p>
            <button id="admin-control" class="border">Admin control</button>
        </section>
    `)
    const setPublicPalette = async (palette: typeof adminPalette) => {
        await page.evaluate((variables) => {
            for (const [name, value] of Object.entries(variables)) {
                document.documentElement.style.setProperty(name, value)
            }
        }, resolveThemeColors(palette))
    }
    const readTokens = async (selector: string) =>
        page.locator(selector).evaluate((element, names) => {
            const style = getComputedStyle(element)
            return Object.fromEntries(
                names.map((name) => [name, style.getPropertyValue(`--${name}`).trim()])
            )
        }, tokens)

    // The public scope with the same base palette is the reference for every shared formula.
    await setPublicPalette(adminPalette)
    const expected = await readTokens("#public")
    expect(await readTokens("#admin")).toEqual(expected)

    for (const palette of [
        { foregroundColor: "#EEEEEE", backgroundColor: "#111111", accentColor: "#FF0000" },
        { foregroundColor: "#000000", backgroundColor: "#FFFFFF", accentColor: "#00FF00" },
    ]) {
        await setPublicPalette(palette)
        expect(await readTokens("#public")).not.toEqual(expected)
        expect(await readTokens("#admin")).toEqual(expected)
        await expect(page.locator("#admin")).toHaveCSS("background-color", "rgb(255, 255, 255)")
        await expect(page.locator("#admin-text")).toHaveCSS("color", "rgb(15, 23, 42)")
        const border = await page.locator("#admin-control").evaluate((element) => {
            const reference = document.createElement("div")
            reference.style.color = getComputedStyle(element).getPropertyValue("--border")
            element.append(reference)
            const color = getComputedStyle(reference).color
            reference.remove()
            return color
        })
        await expect(page.locator("#admin-control")).toHaveCSS("border-top-color", border)
    }
})
