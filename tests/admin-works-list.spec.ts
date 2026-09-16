import { createHash, randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"

import { GET } from "../app/admin/media/[mediaId]/route"
import { formatUploadedDate } from "../components/admin-works/WorkCard"
import { getVisiblePages } from "../components/admin-works/WorksPagination"
import { getPortfolioPreviewHref } from "../lib/admin-routes"
import { db } from "../db"
import { accounts, artPieces, categories, media, users } from "../db/schema"

import { developmentSeedPassword } from "@/db/seed-guard"
import { artistLoginEmail } from "@/lib/auth/config"
import { getAuth } from "@/lib/auth/server"

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff])
const pngHash = createHash("sha256").update(pngBytes).digest("hex")

const categoryId = randomUUID()
const hiddenArtworkId = randomUUID()
const hiddenMediaId = randomUUID()

async function requestAdminMedia(mediaId: string, cookie?: string, ifNoneMatch?: string) {
    return GET(
        new Request(`http://localhost/admin/media/${mediaId}`, {
            headers: {
                ...(cookie ? { cookie } : {}),
                ...(ifNoneMatch ? { "if-none-match": ifNoneMatch } : {}),
            },
        }),
        { params: Promise.resolve({ mediaId }) }
    )
}

test.beforeAll(async () => {
    await db.insert(categories).values({
        categoryId,
        namePln: `Admin media ${categoryId}`,
        nameEng: `Admin media ${categoryId}`,
    })
    await db.insert(artPieces).values({
        artPieceId: hiddenArtworkId,
        categoryId,
        isVisible: false,
        titlePln: "Ukryta praca",
    })
    await db.insert(media).values({
        mediaId: hiddenMediaId,
        artPieceId: hiddenArtworkId,
        content: pngBytes,
        contentHash: pngHash,
        fileType: "png",
        orderIndex: 0,
    })
})

test.afterAll(async () => {
    await db.delete(artPieces).where(eq(artPieces.artPieceId, hiddenArtworkId))
    await db.delete(categories).where(eq(categories.categoryId, categoryId))
})

test.describe("admin media route and pagination helpers", () => {
    test("rejects anonymous requests for hidden work media", async () => {
        const response = await requestAdminMedia(hiddenMediaId)
        expect(response.status).toBe(401)
        expect(response.headers.get("cache-control")).toBe("no-store")
    })

    test("serves media privately and honors ETags for the signed-in artist", async () => {
        const fixtureId = randomUUID()
        const password = "media-fixture-password"
        const [existing] = await db.select({ id: users.id, email: users.email }).from(users)
        const user = existing ?? { id: fixtureId, email: artistLoginEmail }
        const [credential] = await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(eq(accounts.userId, user.id))
        // Use the normal test seed if it is present; otherwise create a test-only artist.
        if (!existing) await db.insert(users).values({ ...user, name: "Media Test Artist" })
        if (!credential)
            await db.insert(accounts).values({
                accountId: user.id,
                providerId: "credential",
                userId: user.id,
                password: await hashPassword(password),
            })
        try {
            const auth = await getAuth()
            const signIn = await auth.api.signInEmail({
                body: {
                    email: user.email,
                    password: credential ? developmentSeedPassword : password,
                },
                asResponse: true,
            })
            expect(signIn.ok).toBe(true)
            const cookie = signIn.headers
                .getSetCookie()
                .map((value) => value.split(";", 1)[0])
                .join("; ")
            const response = await requestAdminMedia(hiddenMediaId, cookie)
            expect(response.status).toBe(200)
            expect(response.headers.get("cache-control")).toBe("private, no-cache")
            expect(response.headers.get("content-type")).toBe("image/png")
            expect(Buffer.from(await response.arrayBuffer()).equals(pngBytes)).toBe(true)

            const cached = await requestAdminMedia(hiddenMediaId, cookie, `"${pngHash}"`)
            expect(cached.status).toBe(304)
            expect(cached.headers.get("cache-control")).toBe("private, no-cache")
            expect((await requestAdminMedia(randomUUID(), cookie)).status).toBe(404)
            expect((await requestAdminMedia("not-a-uuid", cookie)).status).toBe(404)
        } finally {
            if (!existing) await db.delete(users).where(eq(users.id, fixtureId))
            else if (!credential) await db.delete(accounts).where(eq(accounts.userId, user.id))
        }
    })

    test("computes a sliding window of up to 5 page numbers", () => {
        expect(getVisiblePages(1, 3)).toEqual([1, 2, 3])
        expect(getVisiblePages(1, 8)).toEqual([1, 2, 3, 4, 5])
        expect(getVisiblePages(4, 8)).toEqual([2, 3, 4, 5, 6])
        expect(getVisiblePages(8, 8)).toEqual([4, 5, 6, 7, 8])
    })

    test("resolves portfolio preview href for works index and edit pages", () => {
        expect(getPortfolioPreviewHref("/admin/works")).toBe("/portfolio")
        expect(getPortfolioPreviewHref("/admin/works/new")).toBe("/portfolio")
        expect(getPortfolioPreviewHref("/admin/works/123/edit")).toBe("/work/123")
        expect(getPortfolioPreviewHref("/admin/works/123/edit/")).toBe("/work/123")
        expect(getPortfolioPreviewHref("/admin/categories")).toBe("/portfolio")
        expect(getPortfolioPreviewHref("/admin/profile")).toBe("/about")
        expect(getPortfolioPreviewHref("/admin")).toBe("/")
    })

    test("formats uploaded date in Europe/Warsaw timezone regardless of local timezone", () => {
        // 2026-11-06 23:30 UTC is 2026-11-07 00:30 in Europe/Warsaw (UTC+1)
        const date = new Date("2026-11-06T23:30:00Z")
        expect(formatUploadedDate(date)).toBe("07.11.2026")
    })
})
