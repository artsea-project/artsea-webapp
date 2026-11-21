import { createHash, randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { eq, inArray } from "drizzle-orm"

import { db } from "../db"
import { artPieces, artPieceTags, categories, media, tags } from "../db/schema"
import type { Locale } from "../i18n/routing"
import { loadPortfolioArtworks } from "../lib/portfolio-data"

const categoryId = randomUUID()
const hiddenCategoryId = randomUUID()
const visibleWithMediaId = randomUUID()
const hiddenId = randomUUID()
const withoutMediaId = randomUUID()
const englishOnlyId = randomUUID()
const coverMediaId = randomUUID()
const secondMediaId = randomUUID()
const sharedTagId = randomUUID()
const hiddenOnlyTagId = randomUUID()
const insertedArtworkIds: string[] = [visibleWithMediaId, hiddenId, withoutMediaId, englishOnlyId]

function mediaRow(mediaId: string, artPieceId: string, orderIndex: number) {
    const content = Buffer.from(`portfolio-test-${mediaId}`)
    return {
        mediaId,
        artPieceId,
        content,
        contentHash: createHash("sha256").update(content).digest("hex"),
        fileType: "jpg" as const,
        orderIndex,
    }
}

async function loadInserted(locale: Locale) {
    return (await loadPortfolioArtworks(locale)).filter((artwork) =>
        insertedArtworkIds.includes(artwork.artPieceId)
    )
}

test.beforeAll(async () => {
    await db.insert(categories).values([
        { categoryId, namePln: `Portfolio ${categoryId}`, nameEng: `Portfolio EN ${categoryId}` },
        {
            categoryId: hiddenCategoryId,
            namePln: `Ukryta ${hiddenCategoryId}`,
            nameEng: `Hidden ${hiddenCategoryId}`,
        },
    ])
    await db.insert(tags).values([
        { tagId: sharedTagId, namePln: `wspólny-${sharedTagId}`, nameEng: `shared-${sharedTagId}` },
        {
            tagId: hiddenOnlyTagId,
            namePln: `ukryty-${hiddenOnlyTagId}`,
            nameEng: `hidden-${hiddenOnlyTagId}`,
        },
    ])
    await db.insert(artPieces).values([
        {
            artPieceId: visibleWithMediaId,
            categoryId,
            isVisible: true,
            titlePln: "Widoczna",
            titleEng: "Visible",
            yearOfExecution: 2024,
        },
        {
            artPieceId: hiddenId,
            categoryId: hiddenCategoryId,
            isVisible: false,
            titlePln: "Ukryta",
        },
        { artPieceId: withoutMediaId, categoryId, isVisible: true, titlePln: "Bez mediów" },
        { artPieceId: englishOnlyId, categoryId, isVisible: true, titleEng: "English only" },
    ])
    await db
        .insert(media)
        .values([
            mediaRow(secondMediaId, visibleWithMediaId, 1),
            mediaRow(coverMediaId, visibleWithMediaId, 0),
            mediaRow(randomUUID(), hiddenId, 0),
            mediaRow(randomUUID(), englishOnlyId, 0),
        ])
    await db.insert(artPieceTags).values([
        { artPieceId: visibleWithMediaId, tagId: sharedTagId },
        { artPieceId: hiddenId, tagId: sharedTagId },
        { artPieceId: hiddenId, tagId: hiddenOnlyTagId },
    ])
})

test.afterAll(async () => {
    await db.delete(artPieces).where(inArray(artPieces.artPieceId, insertedArtworkIds))
    await db.delete(tags).where(inArray(tags.tagId, [sharedTagId, hiddenOnlyTagId]))
    await db.delete(categories).where(eq(categories.categoryId, categoryId))
    await db.delete(categories).where(eq(categories.categoryId, hiddenCategoryId))
})

test("lists only visible works with media, using the first media as cover", async () => {
    const artworks = await loadInserted("pl")
    const visible = artworks.find((artwork) => artwork.artPieceId === visibleWithMediaId)

    expect(artworks.map((artwork) => artwork.artPieceId).sort()).toEqual(
        [visibleWithMediaId, englishOnlyId].sort()
    )
    expect(visible).toMatchObject({
        title: "Widoczna",
        year: 2024,
        category: { id: categoryId, name: `Portfolio ${categoryId}` },
        tags: [{ id: sharedTagId, name: `wspólny-${sharedTagId}` }],
        cover: { mediaId: coverMediaId, fileType: "jpg" },
    })
})

test("reads names in the current language with the same ids", async () => {
    const visible = (await loadInserted("en")).find(
        (artwork) => artwork.artPieceId === visibleWithMediaId
    )

    expect(visible).toMatchObject({
        title: "Visible",
        category: { id: categoryId, name: `Portfolio EN ${categoryId}` },
        tags: [{ id: sharedTagId, name: `shared-${sharedTagId}` }],
    })
})

test("leaves the title empty when it is missing in the current language", async () => {
    const titleOf = async (locale: Locale) =>
        (await loadInserted(locale)).find((artwork) => artwork.artPieceId === englishOnlyId)?.title

    expect(await titleOf("pl")).toBeNull()
    expect(await titleOf("en")).toBe("English only")
})

test("does not leak categories or tags used only by hidden works", async () => {
    const artworks = await loadPortfolioArtworks("pl")

    expect(artworks.some((artwork) => artwork.category.id === hiddenCategoryId)).toBe(false)
    expect(artworks.some((artwork) => artwork.tags.some((tag) => tag.id === hiddenOnlyTagId))).toBe(
        false
    )
})
