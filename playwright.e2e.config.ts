import { defineConfig, devices } from "@playwright/test"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, ".env.local") })

const baseURL = "http://localhost:3000"

export default defineConfig({
    testDir: "./tests/e2e",
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: "list",
    use: {
        baseURL,
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
    },
})
