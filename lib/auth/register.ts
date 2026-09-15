import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { accounts, authInstallation, profiles, users } from "@/db/schema"
import { artistLoginEmail } from "@/lib/auth/config"
import { isNonemptyPassword } from "@/lib/auth/password"
import { firstLoginSetupLock } from "@/lib/auth/setup-lock"
import { deleteSetupToken, verifySetupToken } from "@/lib/auth/setup-token"

type RegistrationInput = {
    fullName: string
    password: string
    repeatedPassword: string
    setupToken: string
    runtimeDirectory?: string
}

export type RegistrationResult =
    | { ok: true }
    | {
          ok: false
          code:
              | "ACCOUNT_EXISTS"
              | "SETUP_COMPLETED"
              | "INVALID_TOKEN"
              | "INVALID_NAME"
              | "PASSWORD_MISMATCH"
              | "INVALID_PASSWORD"
      }

export async function registerArtist(input: RegistrationInput): Promise<RegistrationResult> {
    const result = await db.transaction(async (tx): Promise<RegistrationResult> => {
        await tx.execute(firstLoginSetupLock)

        const [existingUser] = await tx.select({ id: users.id }).from(users).limit(1)
        if (existingUser) {
            return { ok: false, code: "ACCOUNT_EXISTS" }
        }

        if (!(await verifySetupToken(input.setupToken, input.runtimeDirectory))) {
            return { ok: false, code: "INVALID_TOKEN" }
        }

        const fullName = input.fullName.trim()
        if (!fullName) {
            return { ok: false, code: "INVALID_NAME" }
        }
        if (input.password !== input.repeatedPassword) {
            return { ok: false, code: "PASSWORD_MISMATCH" }
        }
        if (!isNonemptyPassword(input.password)) {
            return { ok: false, code: "INVALID_PASSWORD" }
        }

        const [installation] = await tx
            .select({
                id: authInstallation.id,
                setupCompletedAt: authInstallation.setupCompletedAt,
            })
            .from(authInstallation)
            .limit(1)
        if (!installation) {
            throw new Error(
                "Authentication settings are missing. Run npm run auth:first-login again."
            )
        }
        if (installation.setupCompletedAt) {
            return { ok: false, code: "SETUP_COMPLETED" }
        }

        const [user] = await tx
            .insert(users)
            .values({ name: fullName, email: artistLoginEmail })
            .returning({ id: users.id })
        const password = await hashPassword(input.password)
        await tx.insert(accounts).values({
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password,
        })

        const updatedProfiles = await tx
            .update(profiles)
            .set({ fullName })
            .returning({ id: profiles.profileId })
        if (updatedProfiles.length === 0) {
            await tx.insert(profiles).values({ fullName })
        }

        await tx
            .update(authInstallation)
            .set({ setupCompletedAt: new Date(), updatedAt: new Date() })
            .where(eq(authInstallation.id, installation.id))

        return { ok: true }
    })

    if (result.ok) {
        await deleteSetupToken(input.runtimeDirectory)
    }

    return result
}
