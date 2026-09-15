import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"

config({
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local"),
    quiet: true,
})

async function main() {
    const { formatFirstLoginResult, prepareFirstLogin } = await import("../lib/auth/first-login")
    const result = await prepareFirstLogin()
    console.log(formatFirstLoginResult(result))
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`Unable to prepare first-login setup: ${message}`)
    process.exitCode = 1
})
