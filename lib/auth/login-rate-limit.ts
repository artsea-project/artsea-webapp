const MAX_FAILURES = 30
const WINDOW_MS = 10 * 60_000

type LoginOutcome =
    | { status: "limited" }
    | { status: "invalid-password" }
    | { status: "verified"; response: Response }

async function isInvalidPassword(response: Response): Promise<boolean> {
    if (response.status !== 401) return false
    const body: { code?: string } | null = await response.clone().json()
    return body?.code === "INVALID_EMAIL_OR_PASSWORD"
}

export function createLoginRateLimiter(clock = () => performance.now()) {
    let failures = 0
    let windowEndsAt = 0
    let pending = Promise.resolve()

    return function limitLogin(verify: () => Promise<Response>): Promise<LoginOutcome> {
        // Queue the check and verification together so concurrent requests share the budget.
        const attempt = pending.then(async (): Promise<LoginOutcome> => {
            if (clock() >= windowEndsAt) failures = 0
            if (failures >= MAX_FAILURES) return { status: "limited" }

            const response = await verify()
            if (!(await isInvalidPassword(response))) return { status: "verified", response }

            const now = clock()
            if (now >= windowEndsAt) failures = 0
            if (failures === 0) windowEndsAt = now + WINDOW_MS
            failures += 1
            return { status: "invalid-password" }
        })
        pending = attempt.then(
            () => undefined,
            () => undefined
        )
        return attempt
    }
}
