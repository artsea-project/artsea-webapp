import { createHash, randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { eq, inArray } from "drizzle-orm"

import { db } from "../db"
import { artPieces, artPieceTags, categories, media, tags } from "../db/schema"
import { getAdminWorks, getWorkForEdit, getWorkFormOptions } from "../lib/works/queries"
import { WORKS_PER_PAGE } from "../lib/works/validation"

const suffix = randomUUID().slice(0, 8)
const marker = `qtest${suffix}`
let categoryId: string
let tagId: string
const artPieceIds: string[] = []

function sha256(content: Buffer) {
    return createHash("sha256").update(content).digest("hex")
}

async function createWork(values: Partial<typeof artPieces.$inferInsert> = {}) {
    const [work] = await db
        .insert(artPieces)
        .values({ categoryId, titlePln: `${marker} praca`, ...values })
        .returning({ artPieceId: artPieces.artPieceId })
    artPieceIds.push(work.artPieceId)
    return work.artPieceId
}

async function addMedia(
    artPieceId: string,
    orderIndex: number,
    fileType: "png" | "jpg" | "gif" | "mp4",
    content: Buffer
) {
    const [row] = await db
        .insert(media)
        .values({
            artPieceId,
            content,
            contentHash: sha256(content),
            fileType,
            orderIndex,
        })
        .returning({ mediaId: media.mediaId })
    return row.mediaId
}

test.beforeAll(async () => {
    const [category] = await db
        .insert(categories)
        .values({ namePln: `${marker} kat`, nameEng: `${marker} cat` })
        .returning({ categoryId: categories.categoryId })
    categoryId = category.categoryId

    const [tag] = await db
        .insert(tags)
        .values({ namePln: `${marker}tag`, nameEng: `${marker}tag_en` })
        .returning({ tagId: tags.tagId })
    tagId = tag.tagId
})

test.afterAll(async () => {
    if (artPieceIds.length > 0) {
        await db.delete(artPieces).where(inArray(artPieces.artPieceId, artPieceIds))
    }
    await db.delete(tags).where(eq(tags.tagId, tagId))
    await db.delete(categories).where(eq(categories.categoryId, categoryId))
})

test.describe("works queries", () => {
    test("lists works with pagination, search and cover selection", async () => {
        const first = await createWork({ titlePln: `${marker} alfa`, titleEng: null })
        const second = await createWork({
            titlePln: null,
            titleEng: `${marker} beta`,
            isVisible: false,
        })
        const coverId = await addMedia(first, 1, "jpg", Buffer.from("second"))
        const firstCoverId = await addMedia(first, 0, "png", Buffer.from("first"))
        await addMedia(second, 0, "mp4", Buffer.from("video"))

        const result = await getAdminWorks({ search: marker, page: 1 })

        expect(result.total).toBe(2)
        expect(result.pageCount).toBe(1)
        expect(result.page).toBe(1)

        const alfa = result.works.find((work) => work.artPieceId === first)
        const beta = result.works.find((work) => work.artPieceId === second)
        expect(alfa).toMatchObject({
            title: `${marker} alfa`,
            categoryNamePln: `${marker} kat`,
            isVisible: true,
            coverMediaId: firstCoverId,
        })
        expect(alfa?.coverMediaId).not.toBe(coverId)
        expect(beta).toMatchObject({
            title: `${marker} beta`,
            isVisible: false,
            coverMediaId: null,
        })
    })

    test("matches the search term against category names and escapes wildcards", async () => {
        await createWork({ titlePln: "bez znaczenia" })

        const byCategory = await getAdminWorks({ search: `${marker} cat`, page: 1 })
        expect(byCategory.total).toBeGreaterThanOrEqual(1)

        const wildcard = await getAdminWorks({ search: "%", page: 1 })
        expect(wildcard.total).toBe(0)
    })

    test("clamps out-of-range pages and respects the page size", async () => {
        for (let index = 0; index < WORKS_PER_PAGE; index += 1) {
            await createWork({ titlePln: `${marker} paginacja ${index}` })
        }

        const firstPage = await getAdminWorks({ search: `${marker} paginacja`, page: 1 })
        expect(firstPage.works).toHaveLength(WORKS_PER_PAGE)

        const clamped = await getAdminWorks({ search: `${marker} paginacja`, page: 99 })
        expect(clamped.page).toBe(clamped.pageCount)
    })

    test("loads a work for editing with tags and media metadata", async () => {
        const artPieceId = await createWork({
            titlePln: `${marker} edycja`,
            titleEng: `${marker} edit`,
            yearOfExecution: 2024,
            descriptionPln: { technique: "Olej", description: "Opis" },
        })
        await db.insert(artPieceTags).values({ artPieceId, tagId })
        const mediaId = await addMedia(artPieceId, 0, "png", Buffer.from("12345"))

        const work = await getWorkForEdit(artPieceId)

        expect(work).toMatchObject({
            artPieceId,
            categoryId,
            titlePln: `${marker} edycja`,
            titleEng: `${marker} edit`,
            yearOfExecution: 2024,
            descriptionPln: { technique: "Olej", description: "Opis" },
            descriptionEng: { technique: "", description: "" },
            tagIds: [tagId],
            media: [{ mediaId, fileType: "png", orderIndex: 0, sizeBytes: 5 }],
        })
    })

    test("returns null for unknown or malformed work ids", async () => {
        expect(await getWorkForEdit("not-a-uuid")).toBeNull()
        expect(await getWorkForEdit(randomUUID())).toBeNull()
    })

    test("returns form options with categories and tags", async () => {
        const options = await getWorkFormOptions()

        expect(options.categories.some((category) => category.categoryId === categoryId)).toBe(true)
        expect(options.tags.some((tag) => tag.tagId === tagId)).toBe(true)
    })
})
