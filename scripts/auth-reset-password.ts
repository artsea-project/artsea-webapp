import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { promptHidden } from "./hidden-prompt"

config({
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local"),
    quiet: true,
})

async function main() {
    const { getPasswordResetTarget, resetPassword } = await import("@/lib/auth/reset-password")
    const target = await getPasswordResetTarget()

    console.log(`Changing the password for ${target.artistName}.`)
    const password = await promptHidden("New password: ")
    const repeatedPassword = await promptHidden("Repeat new password: ")

    if (password !== repeatedPassword) {
        console.error("Passwords do not match. The password was not changed.")
        process.exitCode = 1
        return
    }

    await resetPassword(target.userId, password)
    console.log(`Password changed for ${target.artistName}. All active sessions were signed out.`)
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`Unable to reset the password: ${message}`)
    process.exitCode = 1
})
