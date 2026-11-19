import { randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { eq } from "drizzle-orm"

import { db } from "../db"
import { artPieces, categories, links, tags } from "../db/schema"
import { getAdminOverviewStats } from "../lib/overview/queries"

const suffix = randomUUID().slice(0, 8)
const marker = `ovtest${suffix}`

let categoryId: string
let tagId: string
let workId: string
let linkId: string

test.describe("admin overview queries", () => {
    test.beforeAll(async () => {
        const [cat] = await db
            .insert(categories)
            .values({ namePln: `${marker} kat`, nameEng: `${marker} cat` })
            .returning({ categoryId: categories.categoryId })
        categoryId = cat.categoryId

        const [tag] = await db
            .insert(tags)
            .values({ namePln: `${marker}tag`, nameEng: `${marker}tag` })
            .returning({ tagId: tags.tagId })
        tagId = tag.tagId

        const [work] = await db
            .insert(artPieces)
            .values({ categoryId, titlePln: `${marker} praca`, isVisible: true })
            .returning({ artPieceId: artPieces.artPieceId })
        workId = work.artPieceId

        const [link] = await db
            .insert(links)
            .values({ name: `${marker} Instagram`, url: `https://instagram.com/${marker}` })
            .returning({ linkId: links.linkId })
        linkId = link.linkId
    })

    test.afterAll(async () => {
        if (workId) await db.delete(artPieces).where(eq(artPieces.artPieceId, workId))
        if (categoryId) await db.delete(categories).where(eq(categories.categoryId, categoryId))
        if (tagId) await db.delete(tags).where(eq(tags.tagId, tagId))
        if (linkId) await db.delete(links).where(eq(links.linkId, linkId))
    })

    test("returns positive counts and includes created social link", async () => {
        const stats = await getAdminOverviewStats()

        expect(stats.worksCount).toBeGreaterThanOrEqual(1)
        expect(stats.categoriesCount).toBeGreaterThanOrEqual(1)
        expect(stats.tagsCount).toBeGreaterThanOrEqual(1)
        expect(stats.links.some((link) => link.linkId === linkId)).toBe(true)
    })
})
