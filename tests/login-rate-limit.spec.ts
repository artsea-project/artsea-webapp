import { expect, test } from "@playwright/test"
import { inArray, like } from "drizzle-orm"
import { db } from "@/db"
import { rateLimits } from "@/db/schema"
import {
    consumeLoginAttempt,
    loginRateLimit,
    pruneLoginRateLimitBuckets,
} from "@/lib/auth/login-rate-limit"

test.describe("admin login rate limit", () => {
    test.beforeEach(async () => {
        await db.delete(rateLimits).where(like(rateLimits.key, `${loginRateLimit.keyPrefix}%`))
    })

    test("prunes old login buckets at most once per hour and leaves other buckets alone", async () => {
        const now = 1_800_000_000_000
        const hour = 60 * 60_000
        const expiredKey = `${loginRateLimit.keyPrefix}expired`
        const recentKey = `${loginRateLimit.keyPrefix}recent`
        const unrelatedKey = "test:unrelated-rate-limit"
        const keys = [expiredKey, recentKey, unrelatedKey]
        const readKeys = async () => {
            const rows = await db
                .select({ key: rateLimits.key })
                .from(rateLimits)
                .where(inArray(rateLimits.key, keys))
            return rows.map(({ key }) => key).sort()
        }

        try {
            await db.insert(rateLimits).values([
                { key: expiredKey, count: 1, lastRequest: now - hour - 1 },
                { key: recentKey, count: 1, lastRequest: now - loginRateLimit.windowMs / 2 },
                { key: unrelatedKey, count: 1, lastRequest: now - hour - 1 },
            ])

            await pruneLoginRateLimitBuckets(now)
            expect(await readKeys()).toEqual([recentKey, unrelatedKey])

            await db
                .insert(rateLimits)
                .values({ key: expiredKey, count: 1, lastRequest: now - hour - 1 })
            await pruneLoginRateLimitBuckets(now + hour - 1)
            expect(await readKeys()).toEqual(keys)

            await pruneLoginRateLimitBuckets(now + hour)
            expect(await readKeys()).toEqual([unrelatedKey])
        } finally {
            await db.delete(rateLimits).where(inArray(rateLimits.key, keys))
        }
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
