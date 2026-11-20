import { expect, test } from "@playwright/test"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { db } from "@/db"
import { accounts, authInstallation, profiles, users } from "@/db/schema"
import { formatFirstLoginResult, prepareFirstLogin } from "@/lib/auth/first-login"
import { getOrCreateAuthInstallation } from "@/lib/auth/installation"

const userId = "a7f3bc01-0000-4000-8000-000000000092"

test.describe("first-login command", () => {
    let runtimeDirectory: string

    test.beforeEach(async () => {
        runtimeDirectory = await mkdtemp(path.join(os.tmpdir(), "artsea-first-login-test-"))
        await db.delete(users)
        await db.delete(profiles)
        await db.delete(authInstallation)
        await getOrCreateAuthInstallation()
    })

    test.afterEach(async () => {
        await rm(runtimeDirectory, { recursive: true, force: true })
    })

    test("prints the same private setup URL while the container runtime survives", async () => {
        const options = {
            publicUrl: new URL("https://portfolio.example"),
            runtimeDirectory,
        }
        const first = await prepareFirstLogin(options)
        const second = await prepareFirstLogin(options)

        expect(first).toEqual(second)
        expect(first.kind).toBe("setup")
        expect(formatFirstLoginResult(first)).toMatch(
            /https:\/\/portfolio\.example\/admin\/first-login\/[A-Za-z0-9_-]{43}/
        )
    })

    test("skips setup and prints copy ready recovery guidance for an existing account", async () => {
        await db.insert(users).values({
            id: userId,
            name: "Internal Artist",
            email: "artist-command-test@artsea.local",
        })
        await db.insert(accounts).values({
            accountId: userId,
            providerId: "credential",
            userId,
            password: "test-hash",
        })
        await db.insert(profiles).values({ fullName: "Élise Roux" })

        const result = await prepareFirstLogin({ runtimeDirectory })
        expect(result).toEqual({ kind: "registered", artistName: "Élise Roux" })
        expect(formatFirstLoginResult(result)).toBe(
            [
                "An account for Élise Roux already exists. Skipping first-login setup.",
                "",
                "If you forgot the password or want to change it, copy and run:",
                "",
                "npm run auth:reset-password",
            ].join("\n")
        )
    })

    test("does not reopen a completed installation whose user is missing", async () => {
        await db.update(authInstallation).set({ setupCompletedAt: new Date() })

        await expect(prepareFirstLogin({ runtimeDirectory })).rejects.toThrow(
            /setup was already completed/
        )
    })

    test("reports an existing user without a credential as inconsistent", async () => {
        await db.insert(users).values({
            id: userId,
            name: "Incomplete Artist",
            email: "incomplete@artsea.local",
        })

        await expect(prepareFirstLogin({ runtimeDirectory })).rejects.toThrow(/incomplete/)
    })
})
