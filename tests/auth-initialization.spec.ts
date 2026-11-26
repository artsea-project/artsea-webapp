import { execFileSync } from "node:child_process"
import { test } from "@playwright/test"

test("retries auth initialization after a failure", () => {
    // Use a fresh process so other tests cannot populate the module's auth cache first.
    execFileSync(process.execPath, [
        "--import",
        "tsx",
        "--eval",
        `
const assert = require('node:assert/strict')
const { getAuth } = require('./lib/auth/server.ts')

async function checkRetry() {
    process.env.ARTSEA_PUBLIC_URL = 'ftp://localhost'
    await assert.rejects(getAuth(), /ARTSEA_PUBLIC_URL must use HTTP or HTTPS/)
    process.env.ARTSEA_PUBLIC_URL = 'https://localhost/admin'
    await assert.rejects(getAuth(), /ARTSEA_PUBLIC_URL must contain only the public origin/)
}

checkRetry().catch((error) => { throw error })
`,
    ])
})
