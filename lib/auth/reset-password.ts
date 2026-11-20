import { and, eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { db } from "@/db"
import { accounts, sessions } from "@/db/schema"
import { findRegisteredArtistAccount } from "@/lib/auth/artist-account"
import { isNonemptyPassword } from "@/lib/auth/password"
import { artistPasswordResetLock } from "@/lib/auth/password-lock"

export type PasswordResetTarget = {
    userId: string
    artistName: string
}

export async function getPasswordResetTarget(): Promise<PasswordResetTarget> {
    const account = await findRegisteredArtistAccount()
    if (!account) {
        throw new Error("No account exists yet. Create it first with npm run auth:first-login.")
    }
    return account
}

export async function resetPassword(userId: string, newPassword: string) {
    if (!isNonemptyPassword(newPassword)) {
        throw new Error("Password must not be empty.")
    }
    const password = await hashPassword(newPassword)

    await db.transaction(async (tx) => {
        await tx.execute(artistPasswordResetLock)

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
