import { createHash, randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { eq } from "drizzle-orm"

import { GET } from "../app/admin/media/[mediaId]/route"
import { getVisiblePages } from "../components/admin-works/WorksPagination"
import { getPortfolioPreviewHref } from "../lib/admin-routes"
import { db } from "../db"
import { artPieces, categories, media } from "../db/schema"

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff])
const pngHash = createHash("sha256").update(pngBytes).digest("hex")

const categoryId = randomUUID()
const hiddenArtworkId = randomUUID()
const hiddenMediaId = randomUUID()

async function requestAdminMedia(mediaId: string, ifNoneMatch?: string) {
    return GET(
        new Request(`http://localhost/admin/media/${mediaId}`, {
            headers: ifNoneMatch ? { "if-none-match": ifNoneMatch } : {},
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
    test("serves media for hidden works and honors ETag caching", async () => {
        const response = await requestAdminMedia(hiddenMediaId)
        expect(response.status).toBe(200)
        expect(response.headers.get("content-type")).toBe("image/png")
        expect(Buffer.from(await response.arrayBuffer()).equals(pngBytes)).toBe(true)

        const cached = await requestAdminMedia(hiddenMediaId, `"${pngHash}"`)
        expect(cached.status).toBe(304)

        expect((await requestAdminMedia(randomUUID())).status).toBe(404)
        expect((await requestAdminMedia("not-a-uuid")).status).toBe(404)
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
})
