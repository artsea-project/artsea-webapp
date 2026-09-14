import { expect, test } from "@playwright/test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { verifyPassword } from "better-auth/crypto"
import { db } from "@/db"
import { accounts, authInstallation, profiles, users } from "@/db/schema"
import { artistLoginEmail } from "@/lib/auth/config"
import { prepareFirstLogin } from "@/lib/auth/first-login"

const executeFile = promisify(execFile)
const seedPassword = "artsea"

test("development seed creates a complete login and disables first-login setup", async () => {
    const { stdout } = await executeFile("npm", ["run", "db:seed", "--", "--reset"], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            NODE_ENV: "test",
            DATABASE_URL: process.env.DATABASE_URL,
        },
    })

    const [user] = await db.select().from(users)
    const [credential] = await db.select().from(accounts)
    const [profile] = await db.select().from(profiles)
    const [installation] = await db.select().from(authInstallation)

    expect(user).toMatchObject({ name: "ArtSea Artist", email: artistLoginEmail })
    expect(profile.fullName).toBe("Anna")
    expect(installation.setupCompletedAt).toBeInstanceOf(Date)
    expect(await verifyPassword({ password: seedPassword, hash: credential.password! })).toBe(true)
    expect(stdout).toContain(`Password: ${seedPassword}`)
    await expect(prepareFirstLogin()).resolves.toEqual({
        kind: "registered",
        artistName: "Anna",
    })
})
