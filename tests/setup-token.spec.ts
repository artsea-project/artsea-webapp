import { expect, test } from "@playwright/test"
import { chmod, lstat, mkdtemp, readFile, rm, symlink } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { deleteSetupToken, getOrCreateSetupToken, verifySetupToken } from "@/lib/auth/setup-token"

test.describe("first-login runtime token", () => {
    let runtimeDirectory: string

    test.beforeEach(async () => {
        runtimeDirectory = await mkdtemp(path.join(os.tmpdir(), "artsea-token-test-"))
    })

    test.afterEach(async () => {
        await rm(runtimeDirectory, { recursive: true, force: true })
    })

    test("reuses one high entropy token in the same runtime directory", async () => {
        const tokens = await Promise.all(
            Array.from({ length: 5 }, () => getOrCreateSetupToken(runtimeDirectory))
        )

        expect(new Set(tokens).size).toBe(1)
        expect(tokens[0]).toMatch(/^[A-Za-z0-9_-]{43}$/)
        expect(await readFile(path.join(runtimeDirectory, "first-login-token"), "utf8")).toBe(
            `${tokens[0]}\n`
        )
        expect((await lstat(path.join(runtimeDirectory, "first-login-token"))).mode & 0o777).toBe(
            0o600
        )
    })

    test("verifies exactly and stops accepting a deleted token", async () => {
        const token = await getOrCreateSetupToken(runtimeDirectory)

        await expect(verifySetupToken(token, runtimeDirectory)).resolves.toBe(true)
        await expect(verifySetupToken(`${token}x`, runtimeDirectory)).resolves.toBe(false)
        await expect(verifySetupToken("", runtimeDirectory)).resolves.toBe(false)

        await deleteSetupToken(runtimeDirectory)
        await expect(verifySetupToken(token, runtimeDirectory)).resolves.toBe(false)
    })

    test("rejects a group/world writable runtime directory", async () => {
        await chmod(runtimeDirectory, 0o777)

        await expect(getOrCreateSetupToken(runtimeDirectory)).rejects.toThrow(
            /group\/world writable/
        )
    })

    test("rejects a symbolic link token file", async () => {
        const target = path.join(runtimeDirectory, "target")
        await symlink(target, path.join(runtimeDirectory, "first-login-token"))

        await expect(getOrCreateSetupToken(runtimeDirectory)).rejects.toThrow(/regular file/)
    })
})
