import { expect, test } from "@playwright/test"
import { like } from "drizzle-orm"
import { db } from "@/db"
import { rateLimits } from "@/db/schema"
import { consumeLoginAttempt, loginRateLimit } from "@/lib/auth/login-rate-limit"

test.describe("admin login rate limit", () => {
    test.beforeEach(async () => {
        await db.delete(rateLimits).where(like(rateLimits.key, `${loginRateLimit.keyPrefix}%`))
    })

    test("enforces independent database-backed client windows", async () => {
        const now = 1_800_000_000_000
        const attacker = new Headers({ "x-forwarded-for": "198.51.100.10" })
        const owner = new Headers({ "x-forwarded-for": "198.51.100.11" })

        for (let attempt = 0; attempt < loginRateLimit.max; attempt += 1) {
            await expect(consumeLoginAttempt(attacker, now)).resolves.toBe(true)
        }
        await expect(consumeLoginAttempt(attacker, now)).resolves.toBe(false)
        await expect(consumeLoginAttempt(owner, now)).resolves.toBe(true)
        await expect(
            consumeLoginAttempt(attacker, now + loginRateLimit.windowMs + 1)
        ).resolves.toBe(true)
    })
})
