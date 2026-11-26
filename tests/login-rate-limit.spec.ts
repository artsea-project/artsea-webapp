import { expect, test } from "@playwright/test"
import { createLoginRateLimiter } from "@/lib/auth/login-rate-limit"

const invalidPassword = async () =>
    Response.json({ code: "INVALID_EMAIL_OR_PASSWORD" }, { status: 401 })

test("shares a budget of 30 incorrect passwords across concurrent requests", async () => {
    const limitLogin = createLoginRateLimiter(() => 0)
    let checks = 0
    const results = await Promise.all(
        Array.from({ length: 35 }, () =>
            limitLogin(async () => {
                checks += 1
                return invalidPassword()
            })
        )
    )
    expect(results.filter(({ status }) => status === "invalid-password")).toHaveLength(30)
    expect(results.filter(({ status }) => status === "limited")).toHaveLength(5)
    expect(checks).toBe(30)
})

test("does not extend the ten minute window when a login is blocked", async () => {
    let now = 0
    const limitLogin = createLoginRateLimiter(() => now)
    await Promise.all(Array.from({ length: 30 }, () => limitLogin(invalidPassword)))
    now = 10 * 60_000 - 1
    await expect(limitLogin(invalidPassword)).resolves.toEqual({ status: "limited" })
    now += 1
    await expect(limitLogin(invalidPassword)).resolves.toEqual({ status: "invalid-password" })
})

test("does not count successful logins or server failures", async () => {
    const limitLogin = createLoginRateLimiter(() => 0)
    await Promise.all(Array.from({ length: 29 }, () => limitLogin(invalidPassword)))
    const success = new Response(null, { status: 200 })
    const unavailable = new Response(null, { status: 503 })
    await expect(limitLogin(async () => success)).resolves.toEqual({
        status: "verified",
        response: success,
    })
    await expect(limitLogin(async () => unavailable)).resolves.toEqual({
        status: "verified",
        response: unavailable,
    })
    await expect(
        limitLogin(async () => {
            throw new Error("unavailable")
        })
    ).rejects.toThrow("unavailable")
    await expect(limitLogin(invalidPassword)).resolves.toEqual({ status: "invalid-password" })
    await expect(limitLogin(invalidPassword)).resolves.toEqual({ status: "limited" })
})
