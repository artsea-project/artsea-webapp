import { createHash, randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { eq, inArray } from "drizzle-orm"

import { db } from "../db"
import { artPieces, artPieceTags, categories, media, tags } from "../db/schema"
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
const englishTagId = randomUUID()
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

test.beforeAll(async () => {
    await db.insert(categories).values([
        { categoryId, namePln: `Portfolio ${categoryId}`, nameEng: `Portfolio ${categoryId}` },
        {
            categoryId: hiddenCategoryId,
            namePln: `Ukryta ${hiddenCategoryId}`,
            nameEng: `Hidden ${hiddenCategoryId}`,
        },
    ])
    await db.insert(tags).values([
        { tagId: sharedTagId, namePln: `wspólny-${sharedTagId}`, nameEng: null },
        { tagId: hiddenOnlyTagId, namePln: `ukryty-${hiddenOnlyTagId}`, nameEng: null },
        { tagId: englishTagId, namePln: null, nameEng: `english-${englishTagId}` },
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
        { artPieceId: englishOnlyId, tagId: englishTagId },
    ])
})

test.afterAll(async () => {
    await db.delete(artPieces).where(inArray(artPieces.artPieceId, insertedArtworkIds))
    await db.delete(tags).where(inArray(tags.tagId, [sharedTagId, hiddenOnlyTagId, englishTagId]))
    await db.delete(categories).where(eq(categories.categoryId, categoryId))
    await db.delete(categories).where(eq(categories.categoryId, hiddenCategoryId))
})

test("lists only visible works with media, using the first media as cover", async () => {
    const artworks = (await loadPortfolioArtworks()).filter((artwork) =>
        insertedArtworkIds.includes(artwork.artPieceId)
    )
    const visible = artworks.find((artwork) => artwork.artPieceId === visibleWithMediaId)

    expect(artworks.map((artwork) => artwork.artPieceId).sort()).toEqual(
        [visibleWithMediaId, englishOnlyId].sort()
    )
    expect(visible).toMatchObject({
        title: "Widoczna",
        year: 2024,
        category: `Portfolio ${categoryId}`,
        tags: [`wspólny-${sharedTagId}`],
        cover: { mediaId: coverMediaId, fileType: "jpg" },
    })
})

test("does not leak categories or tags used only by hidden works", async () => {
    const artworks = await loadPortfolioArtworks()

    expect(artworks.some((artwork) => artwork.category === `Ukryta ${hiddenCategoryId}`)).toBe(
        false
    )
    expect(artworks.some((artwork) => artwork.tags.includes(`ukryty-${hiddenOnlyTagId}`))).toBe(
        false
    )
})

test("falls back to English titles and tags", async () => {
    const englishOnly = (await loadPortfolioArtworks()).find(
        (artwork) => artwork.artPieceId === englishOnlyId
    )

    expect(englishOnly).toMatchObject({
        title: "English only",
        year: null,
        tags: [`english-${englishTagId}`],
    })
})
