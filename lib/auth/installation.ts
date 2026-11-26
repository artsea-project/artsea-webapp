import { randomBytes } from "node:crypto"
import { authInstallation } from "@/db/schema"
import { db } from "@/db"

const AUTH_SECRET_BYTES = 32

type AuthInstallation = {
    id: string
    betterAuthSecret: string
    setupCompletedAt: Date | null
}

type AuthInstallationReader = Pick<typeof db, "select">

export async function getOrCreateAuthInstallation(): Promise<AuthInstallation> {
    const existing = await readAuthInstallation()
    if (existing) {
        return existing
    }

    const secret = randomBytes(AUTH_SECRET_BYTES).toString("base64url")

    await db
        .insert(authInstallation)
        .values({ betterAuthSecret: secret })
        .onConflictDoNothing({ target: authInstallation.isSingleton })

    const created = await readAuthInstallation()
    if (!created) {
        throw new Error("Unable to initialize authentication settings.")
    }

    return created
}

export async function readAuthInstallation(
    database: AuthInstallationReader = db
): Promise<AuthInstallation | null> {
    const rows = await database
        .select({
            id: authInstallation.id,
            betterAuthSecret: authInstallation.betterAuthSecret,
            setupCompletedAt: authInstallation.setupCompletedAt,
        })
        .from(authInstallation)
        .limit(2)

    if (rows.length > 1) {
        throw new Error("Authentication settings are inconsistent: multiple installations exist.")
    }

    return rows[0] ?? null
}
