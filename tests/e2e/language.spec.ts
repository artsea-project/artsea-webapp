import { expect, test } from "@playwright/test"

// "Organic Identity" from the sample seed (npm run db:seed): its Polish title adds " (PL)".
const ARTWORK_ID = "a7f3bc01-0000-4000-8000-000000000107"
const TITLE_EN = "Organic Identity"
const TITLE_PL = "Organic Identity (PL)"

test.describe("Polish browser", () => {
    test.use({ locale: "pl-PL" })

    test("serves Polish without a prefix", async ({ page }) => {
        await page.goto("/")

        await expect(page).toHaveURL("/")
        await expect(page.locator("html")).toHaveAttribute("lang", "pl")
        await expect(page.getByRole("link", { name: "O MNIE" })).toBeVisible()
        await expect(page.getByRole("link", { name: TITLE_PL, exact: true })).toBeVisible()
    })

    test("switches to English and keeps the page", async ({ page }) => {
        await page.goto("/about")
        await page.getByRole("link", { name: "Zmień język na angielski" }).click()

        await expect(page).toHaveURL("/en/about")
        await expect(page.locator("html")).toHaveAttribute("lang", "en")
        await expect(page.getByRole("heading", { name: "About me" })).toBeVisible()
    })

    test("shows a Polish 404 page", async ({ page }) => {
        const response = await page.goto("/nie-ma-takiej-strony")

        expect(response?.status()).toBe(404)
        await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible()
    })
})

test.describe("English browser", () => {
    test.use({ locale: "en-US" })

    test("redirects to the English version", async ({ page }) => {
        await page.goto("/")

        await expect(page).toHaveURL("/en")
        await expect(page.locator("html")).toHaveAttribute("lang", "en")
        await expect(page.getByRole("link", { name: "ABOUT" })).toBeVisible()
        await expect(page.getByRole("heading", { name: "Selected works." })).toBeVisible()
        await expect(page.getByRole("link", { name: TITLE_EN, exact: true })).toBeVisible()
        await expect(page.getByText(TITLE_PL)).toHaveCount(0)
        await expect(page.getByRole("img", { name: TITLE_PL })).toHaveCount(0)
    })

    test("switches to Polish and remembers the choice", async ({ page, context }) => {
        await page.goto(`/en/work/${ARTWORK_ID}`)
        await page.getByRole("link", { name: "Switch language to Polish" }).click()

        await expect(page).toHaveURL(`/work/${ARTWORK_ID}`)
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLE_PL)
        const cookies = await context.cookies()
        expect(cookies.find((cookie) => cookie.name === "NEXT_LOCALE")?.value).toBe("pl")

        await page.goto("/")
        await expect(page).toHaveURL("/")
    })

    test("shows an English 404 page", async ({ page }) => {
        const response = await page.goto("/en/nie-ma-takiej-strony")

        expect(response?.status()).toBe(404)
        await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
    })

    test("keeps the admin panel in Polish and out of search engines", async ({ page }) => {
        await page.goto("/admin")

        await expect(page).toHaveURL("/admin")
        await expect(page.locator("html")).toHaveAttribute("lang", "pl")
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)
    })

    test("translates the page metadata", async ({ page }) => {
        await page.goto("/en")

        await expect(page).toHaveTitle("Artsea Portfolio")
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
            "content",
            "Portfolio of artworks"
        )
    })
})

test("links each page to its other language version", async ({ request }) => {
    const response = await request.get("/", { headers: { "accept-language": "pl" } })
    const links = response.headers()["link"]

    expect(links).toContain('hreflang="pl"')
    expect(links).toContain('hreflang="en"')
})
