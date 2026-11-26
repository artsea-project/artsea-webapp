import { expect, test } from "@playwright/test"
import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { accounts, authInstallation, profiles, sessions, siteSettings, users } from "@/db/schema"
import { getOrCreateAuthInstallation } from "@/lib/auth/installation"
import { artistLoginEmail } from "@/lib/auth/config"
import { deleteSetupToken, getOrCreateSetupToken } from "@/lib/auth/setup-token"

const userId = "a7f3bc01-0000-4000-8000-000000000094"
const password = "browser-test-password"

test.describe("admin authentication", () => {
    test.beforeEach(async () => {
        await db.delete(users)
        await db.delete(profiles)
        await db.delete(authInstallation)
        await deleteSetupToken()
    })

    test("registers from the private first-login URL", async ({ browser, page }) => {
        await getOrCreateAuthInstallation()
        const token = await getOrCreateSetupToken()
        const setupPath = `/admin/first-login/${token}`
        await page.goto(setupPath)

        await expect(page.getByRole("heading", { name: "Pierwsze logowanie" })).toBeVisible()
        await page.getByLabel("Imię i nazwisko lub pseudonim", { exact: true }).fill("Roux")
        await page.getByLabel("Hasło", { exact: true }).fill(password)
        await page.getByLabel("Powtórz hasło").fill("different-password")
        await page.getByRole("button", { name: "Utwórz konto" }).click()
        await expect(page.getByText("Hasła nie są takie same.", { exact: true })).toBeVisible()

        await page.getByLabel("Hasło", { exact: true }).fill(password)
        await page.getByLabel("Powtórz hasło").fill(password)
        await page.getByRole("button", { name: "Utwórz konto" }).click()

        await expect(page).toHaveURL(/\/admin$/)
        await expect(
            page.getByRole("heading", { name: "Przegląd zawartości", exact: true })
        ).toBeVisible()
        await expect(page.locator("aside").getByText("Roux", { exact: true })).toBeVisible()

        const replayPage = await browser.newPage()
        await replayPage.goto(new URL(setupPath, page.url()).href)
        await expect(replayPage).toHaveURL(/\/admin\/login$/)
        await expect(replayPage.getByRole("heading", { name: "Pierwsze logowanie" })).toHaveCount(0)
        await replayPage.close()
    })

    test("logs in with only the artist password and logs out", async ({ page, request }) => {
        await db.insert(users).values({
            id: userId,
            name: "Internal Account Name",
            email: artistLoginEmail,
        })
        await db.insert(accounts).values({
            accountId: userId,
            providerId: "credential",
            userId,
            password: await hashPassword(password),
        })
        await db.insert(profiles).values({
            fullName: "Élise Roux",
            contactEmail: "public@example.com",
        })

        await page.goto("/admin/login")
        await expect(page.getByLabel("Logowanie do portfolio Élise Roux")).toBeVisible()
        await expect(page.getByLabel("Imię i nazwisko lub pseudonim", { exact: true })).toHaveCount(
            0
        )
        await expect(page.getByRole("navigation", { name: "Menu główne" })).toHaveCount(0)

        await page.getByLabel("Hasło").fill(password)
        await page.getByRole("button", { name: "Zaloguj się" }).click()
        await expect(page).toHaveURL(/\/admin$/)

        const sessionResponse = await page.request.get("/api/auth/get-session")
        expect(sessionResponse.status()).toBe(404)
        expect(await sessionResponse.text()).not.toContain(artistLoginEmail)
        expect((await request.post("/api/auth/sign-in/email")).status()).toBe(404)
        expect(await page.getByText(artistLoginEmail, { exact: true }).count()).toBe(0)

        const protectedRoutes = [
            ["/admin", "Przegląd"],
            ["/admin/works", "Prace"],
            ["/admin/categories", "Kategorie"],
            ["/admin/appearance", "Układ i Personalizacja"],
            ["/admin/profile", "Profil"],
        ] as const
        for (const [route, title] of protectedRoutes) {
            await page.goto(route)
            await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible()
            await expect(
                page.locator("aside").getByText("Élise Roux", { exact: true })
            ).toBeVisible()
        }

        await page.locator("aside").getByRole("button", { name: "Wyloguj się" }).click()
        await expect(page).toHaveURL(/\/admin\/login$/)
        for (const [route] of protectedRoutes) {
            await page.goto(route)
            await expect(page).toHaveURL(/\/admin\/login$/)
        }
    })

    for (const [startPath, linkName] of [
        ["/admin", "Profil"],
        ["/admin", "Układ i Personalizacja"],
        ["/admin/profile", "Przegląd"],
    ] as const) {
        test(`redirects a stale admin tab after logout when opening ${linkName}`, async ({
            context,
            page,
        }) => {
            await getOrCreateAuthInstallation()
            const token = await getOrCreateSetupToken()
            await page.goto(`/admin/first-login/${token}`)
            await page.getByLabel("Imię i nazwisko lub pseudonim", { exact: true }).fill("Roux")
            await page.getByLabel("Hasło", { exact: true }).fill(password)
            await page.getByLabel("Powtórz hasło").fill(password)
            await page.getByRole("button", { name: "Utwórz konto" }).click()
            await expect(page).toHaveURL(/\/admin$/)

            const otherTab = await context.newPage()
            await otherTab.goto(startPath)
            const link = otherTab
                .locator("aside")
                .getByRole("link", { name: linkName, exact: true })
            await expect(link).toBeVisible()

            await page.locator("aside").getByRole("button", { name: "Wyloguj się" }).click()
            await expect(page).toHaveURL(/\/admin\/login$/)

            await link.click()
            await expect(otherTab).toHaveURL(/\/admin\/login$/)
            await expect(
                otherTab.getByRole("heading", { name: "Logowanie do panelu" })
            ).toBeVisible()
        })
    }

    test("requires a valid session on client-side navigation between admin pages", async ({
        page,
    }) => {
        await db.insert(users).values({ id: userId, name: "Test Artist", email: artistLoginEmail })
        await db.insert(accounts).values({
            accountId: userId,
            providerId: "credential",
            userId,
            password: await hashPassword(password),
        })

        await page.goto("/admin/login")
        await page.getByLabel("Hasło").fill(password)
        await page.getByRole("button", { name: "Zaloguj się" }).click()
        await expect(page).toHaveURL(/\/admin$/)
        const worksLink = page.locator("aside").getByRole("link", { name: "Prace" })
        await expect(worksLink).toBeVisible()

        await db.delete(sessions).where(eq(sessions.userId, userId))
        await worksLink.click()
        await expect(page).toHaveURL(/\/admin\/login$/)
    })

    test("does not save a theme after the artist session is revoked", async ({ page }) => {
        await db.insert(users).values({ id: userId, name: "Test Artist", email: artistLoginEmail })
        await db.insert(accounts).values({
            accountId: userId,
            providerId: "credential",
            userId,
            password: await hashPassword(password),
        })
        const readTheme = () => db.select({ theme: siteSettings.theme }).from(siteSettings)
        const savedTheme = await readTheme()

        await page.goto("/admin/login")
        await page.getByLabel("Hasło").fill(password)
        await page.getByRole("button", { name: "Zaloguj się" }).click()
        await expect(page).toHaveURL(/\/admin$/)
        await page.goto("/admin/appearance")

        const theme = page.getByRole("region", { name: "Czcionki i kolorystyka" })
        const accent = theme.getByRole("textbox", { name: "Kolor akcentu", exact: true })
        await accent.fill((await accent.inputValue()) === "#123456" ? "#654321" : "#123456")
        const save = theme.getByRole("button", { name: "Zapisz zmiany" })
        await expect(save).toBeEnabled()

        await db.delete(sessions).where(eq(sessions.userId, userId))
        await save.click()
        await expect(page).toHaveURL(/\/admin\/login$/)
        expect(await readTheme()).toEqual(savedTheme)
    })

    for (const route of [
        "/admin",
        "/admin/works",
        "/admin/works/new",
        `/admin/works/${userId}/edit`,
        "/admin/categories",
        "/admin/appearance",
        "/admin/profile",
    ]) {
        test(`redirects anonymous visitors from ${route}`, async ({ page }) => {
            await page.goto(route)
            await expect(page).toHaveURL(/\/admin\/login$/)
            await expect(page.getByRole("heading", { name: "Logowanie do panelu" })).toBeVisible()
            await expect(page.getByRole("navigation", { name: "Menu główne" })).toHaveCount(0)
        })
    }
    test("throttles repeated login-form failures", async ({ page }) => {
        test.setTimeout(60_000)
        await db.insert(users).values({
            id: userId,
            name: "Élise Roux",
            email: artistLoginEmail,
        })
        await db.insert(accounts).values({
            accountId: userId,
            providerId: "credential",
            userId,
            password: await hashPassword(password),
        })
        await db.insert(profiles).values({ fullName: "Élise Roux" })
        await page.goto("/admin/login")

        for (let attempt = 0; attempt <= 30; attempt += 1) {
            await page.getByLabel("Hasło").fill(attempt === 30 ? password : "incorrect-password")
            await Promise.all([
                page.waitForResponse(
                    (response) =>
                        response.request().method() === "POST" &&
                        response.url().endsWith("/admin/login")
                ),
                page.getByRole("button", { name: "Zaloguj się" }).click(),
            ])
            if (attempt < 30) {
                await expect(
                    page.getByText("Nieprawidłowe hasło. Spróbuj ponownie.", { exact: true })
                ).toBeVisible()
            }
        }

        await expect(
            page.getByText("Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.", {
                exact: true,
            })
        ).toBeVisible()
    })

    test("does not expose an ordinary first-login route or public signup", async ({
        page,
        request,
    }) => {
        await page.goto("/admin/first-login")
        await expect(page.getByRole("heading", { name: "Nie znaleziono strony" })).toBeVisible()

        const response = await request.post("/api/auth/sign-up/email", {
            data: {
                name: "Other Artist",
                email: "other@artsea.local",
                password,
            },
            headers: { Origin: new URL(page.url()).origin },
        })
        expect(response.status()).toBe(404)
    })
})
