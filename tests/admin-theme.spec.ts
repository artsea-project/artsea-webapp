import { readFile } from "node:fs/promises"
import path from "node:path"
import tailwindcss from "@tailwindcss/postcss"
import { expect, test } from "@playwright/test"
import postcss from "postcss"
import AdminLayout from "@/app/admin/layout"
import { resolveThemeColors } from "@/lib/theme/colors"

test("admin foreground, background and controls stay independent of portfolio colors", async ({
    page,
}) => {
    const stylesheet = path.resolve("app/globals.css")
    const { css } = await postcss([tailwindcss()]).process(await readFile(stylesheet, "utf8"), {
        from: stylesheet,
    })
    const layout = AdminLayout({ children: null })
    await page.setContent(`
        <style>${css}</style>
        <section id="admin" class="${layout.props.className}">
            <p id="admin-text">Admin content</p>
            <button id="admin-control" class="border">Admin control</button>
        </section>
    `)
    for (const palette of [
        { foregroundColor: "#EEEEEE", backgroundColor: "#111111", accentColor: "#FF0000" },
        { foregroundColor: "#000000", backgroundColor: "#FFFFFF", accentColor: "#00FF00" },
    ]) {
        await page.evaluate((variables) => {
            for (const [name, value] of Object.entries(variables)) {
                document.documentElement.style.setProperty(name, value)
            }
        }, resolveThemeColors(palette))
        await expect(page.locator("#admin")).toHaveCSS("background-color", "rgb(255, 255, 255)")
        await expect(page.locator("#admin-text")).toHaveCSS("color", "rgb(15, 23, 42)")
        await expect(page.locator("#admin-control")).toHaveCSS(
            "border-top-color",
            "rgb(226, 232, 240)"
        )
        expect(
            await page
                .locator("#admin-control")
                .evaluate((element) => getComputedStyle(element).getPropertyValue("--ring").trim())
        ).toBe("#0284c7")
    }
})
