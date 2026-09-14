import { expect, test } from "@playwright/test"
import { db } from "@/db"
import { authInstallation } from "@/db/schema"
import { getOrCreateAuthInstallation } from "@/lib/auth/installation"

test.describe("authentication installation settings", () => {
    test.beforeEach(async () => {
        await db.delete(authInstallation)
    })

    test("creates one stable high entropy secret under concurrent initialization", async () => {
        const installations = await Promise.all(
            Array.from({ length: 5 }, () => getOrCreateAuthInstallation())
        )

        expect(new Set(installations.map((installation) => installation.id)).size).toBe(1)
        expect(
            new Set(installations.map((installation) => installation.betterAuthSecret)).size
        ).toBe(1)
        expect(installations[0].betterAuthSecret.length).toBeGreaterThanOrEqual(43)

        const rows = await db.select().from(authInstallation)
        expect(rows).toHaveLength(1)
    })
})
