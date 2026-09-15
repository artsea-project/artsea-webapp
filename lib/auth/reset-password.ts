import { and, eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { db } from "@/db"
import { accounts, profiles, sessions, users } from "@/db/schema"
import { isNonemptyPassword } from "@/lib/auth/password"

export type PasswordResetTarget = {
    userId: string
    artistName: string
}

export async function getPasswordResetTarget(): Promise<PasswordResetTarget> {
    const userRows = await db.select({ id: users.id, name: users.name }).from(users).limit(2)
    if (userRows.length === 0) {
        throw new Error("No account exists yet. Create it first with npm run auth:first-login.")
    }
    if (userRows.length > 1) {
        throw new Error("Authentication data is inconsistent: multiple users exist.")
    }

    const user = userRows[0]
    const credentials = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")))
        .limit(2)

    if (credentials.length !== 1) {
        throw new Error(
            "Authentication data is incomplete: the existing user does not have exactly one password credential."
        )
    }

    const [profile] = await db.select({ fullName: profiles.fullName }).from(profiles).limit(1)
    return { userId: user.id, artistName: profile?.fullName ?? user.name }
}

export async function resetPassword(userId: string, newPassword: string) {
    if (!isNonemptyPassword(newPassword)) {
        throw new Error("Password must not be empty.")
    }
    const password = await hashPassword(newPassword)

    await db.transaction(async (tx) => {
        const updated = await tx
            .update(accounts)
            .set({ password, updatedAt: new Date() })
            .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
            .returning({ id: accounts.id })

        if (updated.length !== 1) {
            throw new Error("The password credential could not be updated.")
        }

        await tx.delete(sessions).where(eq(sessions.userId, userId))
    })
}
