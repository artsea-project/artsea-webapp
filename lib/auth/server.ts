import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as databaseSchema from "@/db/schema"
import { artistLoginEmail, getPublicUrl } from "@/lib/auth/config"
import { getOrCreateAuthInstallation } from "@/lib/auth/installation"
import { artistSignInLock } from "@/lib/auth/password-lock"

type AuthSettings = { publicUrl: URL; secret: string }
type AuthTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

let authSettingsPromise: Promise<AuthSettings> | undefined
let authPromise: Promise<ReturnType<typeof createAuth>> | undefined

async function loadAuthSettings(): Promise<AuthSettings> {
    const publicUrl = getPublicUrl()
    const installation = await getOrCreateAuthInstallation()
    return { publicUrl, secret: installation.betterAuthSecret }
}

function getAuthSettings() {
    return (authSettingsPromise ??= loadAuthSettings().catch((error) => {
        authSettingsPromise = undefined
        throw error
    }))
}

function createAuth(database: typeof db | AuthTransaction, { publicUrl, secret }: AuthSettings) {
    return betterAuth({
        appName: "Artsea",
        baseURL: publicUrl.origin,
        secret,
        database: drizzleAdapter(database, {
            provider: "pg",
            schema: {
                ...databaseSchema,
                user: databaseSchema.users,
                account: databaseSchema.accounts,
                session: databaseSchema.sessions,
                verification: databaseSchema.verifications,
            },
        }),
        emailAndPassword: {
            enabled: true,
            disableSignUp: true,
        },
        session: {
            expiresIn: 60 * 60 * 24 * 7,
            updateAge: 60 * 60 * 24,
            cookieCache: {
                enabled: false,
            },
        },
        trustedOrigins: [publicUrl.origin],
        advanced: {
            database: {
                generateId: "uuid",
            },
            useSecureCookies: publicUrl.protocol === "https:",
        },
    })
}

export function getAuth() {
    return (authPromise ??= getAuthSettings()
        .then(async (settings) => {
            const auth = createAuth(db, settings)
            await auth.$context
            return auth
        })
        .catch((error) => {
            authPromise = undefined
            throw error
        }))
}

export async function signInArtist(password: string, headers: Headers) {
    const settings = await getAuthSettings()
    return db.transaction(async (tx) => {
        await tx.execute(artistSignInLock)
        // Verify the password and persist the session on the same connection holding the lock.
        return createAuth(tx, settings).api.signInEmail({
            body: { email: artistLoginEmail, password },
            headers,
            asResponse: true,
        })
    })
}
