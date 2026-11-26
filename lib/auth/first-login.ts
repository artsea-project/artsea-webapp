import { db } from "@/db"
import { findRegisteredArtistAccount } from "@/lib/auth/artist-account"
import { getPublicUrl } from "@/lib/auth/config"
import { getOrCreateAuthInstallation, readAuthInstallation } from "@/lib/auth/installation"
import { firstLoginSetupLock } from "@/lib/auth/setup-lock"
import { getOrCreateSetupToken } from "@/lib/auth/setup-token"

type FirstLoginResult = { kind: "setup"; url: string } | { kind: "registered"; artistName: string }

export async function prepareFirstLogin(options?: {
    publicUrl?: URL
    runtimeDirectory?: string
}): Promise<FirstLoginResult> {
    await getOrCreateAuthInstallation()

    return db.transaction(async (tx): Promise<FirstLoginResult> => {
        await tx.execute(firstLoginSetupLock)

        const account = await findRegisteredArtistAccount(tx)
        if (account) {
            return { kind: "registered", artistName: account.artistName }
        }

        const installation = await readAuthInstallation(tx)
        if (!installation) {
            throw new Error("Authentication settings are missing.")
        }
        if (installation.setupCompletedAt) {
            throw new Error(
                "First-login setup was already completed, but the registered account is missing. Restore the account or database backup instead of creating a new setup link."
            )
        }

        const token = await getOrCreateSetupToken(options?.runtimeDirectory)
        const publicUrl = options?.publicUrl ?? getPublicUrl()
        const setupUrl = new URL(`/admin/first-login/${encodeURIComponent(token)}`, publicUrl)

        return { kind: "setup", url: setupUrl.href }
    })
}

export function formatFirstLoginResult(result: FirstLoginResult): string {
    if (result.kind === "registered") {
        return [
            `An account for ${result.artistName} already exists. Skipping first-login setup.`,
            "",
            "If you forgot the password or want to change it, copy and run:",
            "",
            "npm run auth:reset-password",
        ].join("\n")
    }

    return [
        "Artsea is ready for first time setup.",
        "",
        "Open this private link to create your account:",
        "",
        result.url,
    ].join("\n")
}
