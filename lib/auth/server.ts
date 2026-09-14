import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as databaseSchema from "@/db/schema"
import { getPublicUrl } from "@/lib/auth/config"
import { getOrCreateAuthInstallation } from "@/lib/auth/installation"

let authPromise: ReturnType<typeof createAuth> | undefined

function createAuth() {
    return (async () => {
        const [installation, publicUrl] = await Promise.all([
            getOrCreateAuthInstallation(),
            Promise.resolve(getPublicUrl()),
        ])

        return betterAuth({
            appName: "Artsea",
            baseURL: publicUrl.origin,
            secret: installation.betterAuthSecret,
            database: drizzleAdapter(db, {
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
    })()
}

export function getAuth() {
    authPromise ??= createAuth()
    return authPromise
}
