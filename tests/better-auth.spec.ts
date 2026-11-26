import { expect, test } from "@playwright/test"
import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { accounts, sessions, users } from "@/db/schema"
import { getAuth } from "@/lib/auth/server"

const userId = "a7f3bc01-0000-4000-8000-000000000091"
const email = "auth-integration@artsea.local"
const password = "integration-password"

test.describe("Better Auth integration", () => {
    test.beforeAll(async () => {
        await db.delete(users)
        await db.insert(users).values({ id: userId, name: "Auth Integration", email })
        await db.insert(accounts).values({
            accountId: userId,
            providerId: "credential",
            userId,
            password: await hashPassword(password),
        })
    })

    test.afterAll(async () => {
        await db.delete(users).where(eq(users.id, userId))
    })

    test("signs in with a credential account and persists the session", async () => {
        const auth = await getAuth()
        const result = await auth.api.signInEmail({ body: { email, password } })

        expect(result.user.name).toBe("Auth Integration")
        expect(result.token).toBeTruthy()

        const storedSessions = await db
            .select({ token: sessions.token })
            .from(sessions)
            .where(eq(sessions.userId, userId))
        expect(storedSessions).toContainEqual({ token: result.token })
    })

    test("does not extend the fixed seven-day session when it is read", async () => {
        const auth = await getAuth()
        const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true })
        expect(response.ok).toBe(true)
        const { token } = await response.json()
        const cookie = response.headers.get("set-cookie")!.split(";", 1)[0]
        const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        await db.update(sessions).set({ expiresAt }).where(eq(sessions.token, token))

        const result = await auth.api.getSession({ headers: new Headers({ cookie }) })

        expect(result?.session.expiresAt).toEqual(expiresAt)
    })

    test("keeps the public email signup endpoint disabled", async () => {
        const auth = await getAuth()

        await expect(
            auth.api.signUpEmail({
                body: {
                    name: "Other Artist",
                    email: "other@artsea.local",
                    password: "another-password",
                },
            })
        ).rejects.toMatchObject({
            body: { code: "EMAIL_PASSWORD_SIGN_UP_DISABLED" },
        })
    })
})
