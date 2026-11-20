import { defineConfig } from "@playwright/test"
import dotenv from "dotenv"
import os from "node:os"
import path from "node:path"

// Read local development configuration from .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") })

process.env.ARTSEA_RUNTIME_DIR ??= path.join(
    os.tmpdir(),
    `artsea-playwright-runtime-${process.pid}`
)

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
const serverUrl = new URL(baseURL)

export default defineConfig({
    testDir: "./tests",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1, // Database tests should run sequentially to avoid schema/transaction conflicts
    reporter: "list",
    use: {
        baseURL,
    },
    webServer: {
        command: `npm run dev -- --hostname ${serverUrl.hostname} --port ${serverUrl.port || "3000"}`,
        url: baseURL,
        env: { ARTSEA_PUBLIC_URL: serverUrl.origin },
        reuseExistingServer: false,
        timeout: 120_000,
    },
})
