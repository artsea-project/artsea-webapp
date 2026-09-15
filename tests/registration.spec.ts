import { expect, test } from "@playwright/test"
import { verifyPassword } from "better-auth/crypto"
import { mkdtemp, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { db } from "@/db"
import { accounts, authInstallation, profiles, users } from "@/db/schema"
import { prepareFirstLogin } from "@/lib/auth/first-login"
import { getOrCreateAuthInstallation } from "@/lib/auth/installation"
import { artistLoginEmail } from "@/lib/auth/config"
import { registerArtist } from "@/lib/auth/register"
import { getOrCreateSetupToken, verifySetupToken } from "@/lib/auth/setup-token"

test.describe("first-login registration", () => {
    let runtimeDirectory: string
    let setupToken: string

    test.beforeEach(async () => {
        runtimeDirectory = await mkdtemp(path.join(os.tmpdir(), "artsea-registration-test-"))
        await db.delete(users)
        await db.delete(profiles)
        await db.delete(authInstallation)
        await getOrCreateAuthInstallation()
        setupToken = await getOrCreateSetupToken(runtimeDirectory)
    })

    test.afterEach(async () => {
        await rm(runtimeDirectory, { recursive: true, force: true })
    })

    test("creates the singleton user, credential, and canonical profile", async () => {
        const result = await registerArtist({
            fullName: "  Élise Roux  ",
            password: "registration-password",
            repeatedPassword: "registration-password",
            setupToken,
            runtimeDirectory,
        })

        expect(result).toEqual({ ok: true })
        const [user] = await db.select().from(users)
        const [credential] = await db.select().from(accounts)
        const [profile] = await db.select().from(profiles)
        const [installation] = await db.select().from(authInstallation)

        expect(user).toMatchObject({ name: "Élise Roux", email: artistLoginEmail })
        expect(credential).toMatchObject({
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
        })
        expect(
            await verifyPassword({
                password: "registration-password",
                hash: credential.password!,
            })
        ).toBe(true)
        expect(profile.fullName).toBe("Élise Roux")
        expect(installation.setupCompletedAt).toBeInstanceOf(Date)
        await expect(verifySetupToken(setupToken, runtimeDirectory)).resolves.toBe(false)
    })

    test("requires only a nonempty name and password", async () => {
        const input = {
            fullName: "A",
            password: "a",
            repeatedPassword: "a",
            setupToken,
            runtimeDirectory,
        }

        await expect(registerArtist({ ...input, fullName: "  " })).resolves.toEqual({
            ok: false,
            code: "INVALID_NAME",
        })
        await expect(
            registerArtist({ ...input, password: "", repeatedPassword: "" })
        ).resolves.toEqual({
            ok: false,
            code: "INVALID_PASSWORD",
        })
        await expect(registerArtist(input)).resolves.toEqual({ ok: true })
    })

    test("checks for an existing account before checking the token", async () => {
        await db.insert(users).values({ name: "Existing Artist", email: artistLoginEmail })

        await expect(
            registerArtist({
                fullName: "Other Artist",
                password: "registration-password",
                repeatedPassword: "registration-password",
                setupToken: "invalid",
                runtimeDirectory,
            })
        ).resolves.toEqual({ ok: false, code: "ACCOUNT_EXISTS" })
    })

    test("does not reopen setup after completion even when the user is missing", async () => {
        await db.update(authInstallation).set({ setupCompletedAt: new Date() })

        const result = await registerArtist({
            fullName: "Élise Roux",
            password: "registration-password",
            repeatedPassword: "registration-password",
            setupToken,
            runtimeDirectory,
        })

        expect(result).toEqual({ ok: false, code: "SETUP_COMPLETED" })
        expect(await db.select().from(users)).toEqual([])
    })

    test("rejects an invalid token without creating a user", async () => {
        const result = await registerArtist({
            fullName: "Élise Roux",
            password: "registration-password",
            repeatedPassword: "registration-password",
            setupToken: "invalid",
            runtimeDirectory,
        })

        expect(result).toEqual({ ok: false, code: "INVALID_TOKEN" })
        expect(await db.select().from(users)).toEqual([])
    })

    test("does not recreate a token while registration completes", async () => {
        const registration = registerArtist({
            fullName: "Élise Roux",
            password: "registration-password",
            repeatedPassword: "registration-password",
            setupToken,
            runtimeDirectory,
        })
        const preparation = prepareFirstLogin({
            publicUrl: new URL("https://portfolio.example"),
            runtimeDirectory,
        })

        await expect(registration).resolves.toEqual({ ok: true })
        const preparationResult = await preparation
        expect(["setup", "registered"]).toContain(preparationResult.kind)
        await expect(verifySetupToken(setupToken, runtimeDirectory)).resolves.toBe(false)
        await expect(readdir(runtimeDirectory)).resolves.toEqual([])
    })

    test("allows only one concurrent registration", async () => {
        const input = {
            fullName: "Élise Roux",
            password: "registration-password",
            repeatedPassword: "registration-password",
            setupToken,
            runtimeDirectory,
        }
        const results = await Promise.all([registerArtist(input), registerArtist(input)])

        expect(results).toContainEqual({ ok: true })
        expect(results).toContainEqual({ ok: false, code: "ACCOUNT_EXISTS" })
        expect(await db.select().from(users)).toHaveLength(1)
        expect(await db.select().from(accounts)).toHaveLength(1)
    })
})
