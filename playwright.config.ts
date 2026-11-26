import { defineConfig } from "@playwright/test"
import dotenv from "dotenv"
import path from "node:path"

// Read local development configuration from .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") })

export default defineConfig({
    testDir: "./tests",
    testIgnore: ["e2e/**", "**/admin-auth.spec.ts"],
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1, // Database tests should run sequentially to avoid schema/transaction conflicts
    reporter: "list",
})
