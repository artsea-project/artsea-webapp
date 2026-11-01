import { expect, test } from "@playwright/test"

test.use({ locale: "pl-PL" })

test("serves the home page in Polish by default", async ({ page }) => {
    const response = await page.goto("/")

    expect(response?.status()).toBe(200)
    await expect(page.locator("html")).toHaveAttribute("lang", "pl")
})
