import { defineConfig } from "@playwright/test"
import dotenv from "dotenv"
import path from "path"

// Read local development configuration from .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") })

export default defineConfig({
    testDir: "./tests",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1, // Database tests should run sequentially to avoid schema/transaction conflicts
    reporter: "list",
    use: {
        // Browser configurations are omitted since these are direct database integration tests
    },
})
