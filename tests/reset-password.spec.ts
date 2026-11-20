import { expect, test } from "@playwright/test"
import { hashPassword, verifyPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { accounts, profiles, sessions, users } from "@/db/schema"
import { artistLoginEmail } from "@/lib/auth/config"
import { getPasswordResetTarget, resetPassword } from "@/lib/auth/reset-password"
import { signInArtist } from "@/lib/auth/server"

const userId = "a7f3bc01-0000-4000-8000-000000000093"

test.describe("password reset", () => {
    test.beforeEach(async () => {
        await db.delete(users)
        await db.delete(profiles)
        await db.insert(users).values({
            id: userId,
            name: "Password Reset Artist",
            email: artistLoginEmail,
        })
        await db.insert(profiles).values({ fullName: "Password Reset Artist" })
        await db.insert(accounts).values({
            accountId: userId,
            providerId: "credential",
            userId,
            password: await hashPassword("original-password"),
        })
        await db.insert(sessions).values({
            token: "password-reset-session",
            userId,
            expiresAt: new Date(Date.now() + 60_000),
        })
    })

    test("updates the credential and revokes every session", async () => {
        const target = await getPasswordResetTarget()
        expect(target).toEqual({ userId, artistName: "Password Reset Artist" })

        await resetPassword(userId, "a")

        const [credential] = await db
            .select({ password: accounts.password })
            .from(accounts)
            .where(eq(accounts.userId, userId))
        expect(
            await verifyPassword({
                password: "a",
                hash: credential.password!,
            })
        ).toBe(true)
        expect(await db.select().from(sessions).where(eq(sessions.userId, userId))).toEqual([])
    })

    test("only the replacement password can create a session after reset", async () => {
        const headers = new Headers()
        await resetPassword(userId, "replacement-password")

        expect((await signInArtist("original-password", headers)).status).toBe(401)
        expect(await db.select().from(sessions).where(eq(sessions.userId, userId))).toEqual([])

        expect((await signInArtist("replacement-password", headers)).ok).toBe(true)
        expect(await db.select().from(sessions).where(eq(sessions.userId, userId))).toHaveLength(1)
    })

    test("rejects an empty password without revoking the active session", async () => {
        await expect(resetPassword(userId, "")).rejects.toThrow("Password must not be empty.")
        const activeSessions = await db.select().from(sessions).where(eq(sessions.userId, userId))
        expect(activeSessions).toHaveLength(1)
    })
})
