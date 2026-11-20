import { createHash } from "node:crypto"
import { and, like, lt, sql } from "drizzle-orm"
import { db } from "@/db"
import { rateLimits } from "@/db/schema"

const LOGIN_RATE_LIMIT_KEY_PREFIX = "artsea:admin-login:client:"
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000
const LOGIN_RATE_LIMIT_MAX = 10
const CLEANUP_INTERVAL_MS = 60 * 60_000
const BUCKET_RETENTION_MS = 60 * 60_000

let nextCleanupAt = 0

export async function pruneLoginRateLimitBuckets(now = Date.now()): Promise<void> {
    if (now < nextCleanupAt) return

    // Reserve the interval before awaiting the query so concurrent attempts don't repeat it.
    nextCleanupAt = now + CLEANUP_INTERVAL_MS
    await db
        .delete(rateLimits)
        .where(
            and(
                like(rateLimits.key, `${LOGIN_RATE_LIMIT_KEY_PREFIX}%`),
                lt(rateLimits.lastRequest, now - BUCKET_RETENTION_MS)
            )
        )
}

export async function consumeLoginAttempt(
    requestHeaders: Pick<Headers, "get">,
    now = Date.now()
): Promise<boolean> {
    const clientAddress =
        requestHeaders.get("x-forwarded-for") ??
        requestHeaders.get("x-real-ip") ??
        "unavailable-client"
    const clientKey = createHash("sha256").update(clientAddress).digest("base64url")
    const key = `${LOGIN_RATE_LIMIT_KEY_PREFIX}${clientKey}`
    const windowStart = now - LOGIN_RATE_LIMIT_WINDOW_MS

    const [bucket] = await db
        .insert(rateLimits)
        .values({ key, count: 1, lastRequest: now })
        .onConflictDoUpdate({
            target: rateLimits.key,
            set: {
                count: sql<number>`case
                    when ${rateLimits.lastRequest} < ${windowStart} then 1
                    else ${rateLimits.count} + 1
                end`,
                lastRequest: sql<number>`case
                    when ${rateLimits.lastRequest} < ${windowStart} then ${now}
                    else ${rateLimits.lastRequest}
                end`,
            },
        })
        .returning({ count: rateLimits.count })

    return bucket.count <= LOGIN_RATE_LIMIT_MAX
}

export const loginRateLimit = {
    keyPrefix: LOGIN_RATE_LIMIT_KEY_PREFIX,
    max: LOGIN_RATE_LIMIT_MAX,
    windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
} as const
