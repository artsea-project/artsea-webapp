import { randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { eq, inArray } from "drizzle-orm"

import {
    createCategory,
    createTag,
    deleteCategory,
    deleteTag,
    updateCategory,
} from "../app/admin/categories/actions"
import { db } from "../db"
import { artPieces, categories, tags } from "../db/schema"
import { initialCategoryFormState, initialTagFormState } from "../lib/categories/form-state"
import {
    checkCategoryNameEng,
    checkCategoryNamePln,
    checkTagNameEng,
    checkTagNamePln,
    formatWorksCount,
    normalizeTagName,
} from "../lib/categories/validation"

const suffix = randomUUID().slice(0, 8)
const createdCategoryNamesPln: string[] = []
const createdTagNamesPln: string[] = []
const createdArtworkIds: string[] = []

function makeFormData(entries: Record<string, string>): FormData {
    const formData = new FormData()
    for (const [key, value] of Object.entries(entries)) {
        formData.set(key, value)
    }
    return formData
}

test.afterAll(async () => {
    if (createdArtworkIds.length > 0) {
        await db.delete(artPieces).where(inArray(artPieces.artPieceId, createdArtworkIds))
    }
    if (createdCategoryNamesPln.length > 0) {
        await db.delete(categories).where(inArray(categories.namePln, createdCategoryNamesPln))
    }
    if (createdTagNamesPln.length > 0) {
        await db.delete(tags).where(inArray(tags.namePln, createdTagNamesPln))
    }
})

test.describe("category and tag validation helpers", () => {
    test("requires Polish and English category names", () => {
        expect(checkCategoryNamePln("   ")).toBe("Podaj nazwę kategorii po polsku.")
        expect(checkCategoryNameEng("")).toBe("Podaj nazwę kategorii po angielsku.")
        expect(checkCategoryNamePln("Malarstwo")).toBeNull()
        expect(checkCategoryNameEng("Painting")).toBeNull()
    })

    test("strips leading '#' from tag names and validates non-empty values", () => {
        expect(normalizeTagName("  ##minimalizm  ")).toBe("minimalizm")
        expect(checkTagNamePln(" ### ")).toBe("Podaj nazwę tagu po polsku.")
        expect(checkTagNameEng("")).toBe("Podaj nazwę tagu po angielsku.")
        expect(checkTagNamePln("#grafika")).toBeNull()
        expect(checkTagNameEng("graphics")).toBeNull()
    })

    test("formats Polish plural forms for artwork counts", () => {
        expect(formatWorksCount(0)).toBe("0 prac")
        expect(formatWorksCount(1)).toBe("1 praca")
        expect(formatWorksCount(2)).toBe("2 prace")
        expect(formatWorksCount(4)).toBe("4 prace")
        expect(formatWorksCount(5)).toBe("5 prac")
        expect(formatWorksCount(12)).toBe("12 prac")
        expect(formatWorksCount(22)).toBe("22 prace")
    })
})

test.describe("category and tag server actions", () => {
    test("returns fieldErrors when category or tag inputs are empty", async () => {
        const categoryState = await createCategory(
            initialCategoryFormState,
            makeFormData({ namePln: "   ", nameEng: "" })
        )
        expect(categoryState).toEqual({
            status: "error",
            fieldErrors: {
                namePln: "Podaj nazwę kategorii po polsku.",
                nameEng: "Podaj nazwę kategorii po angielsku.",
            },
        })

        const tagState = await createTag(
            initialTagFormState,
            makeFormData({ namePln: "###", nameEng: "  " })
        )
        expect(tagState).toEqual({
            status: "error",
            fieldErrors: {
                namePln: "Podaj nazwę tagu po polsku.",
                nameEng: "Podaj nazwę tagu po angielsku.",
            },
        })
    })

    test("creates, updates, and prevents duplicate categories with per-field errors", async () => {
        const namePln = `Kategoria PL ${suffix}`
        const nameEng = `Category EN ${suffix}`
        const updatedPln = `Kategoria PL Zmieniona ${suffix}`
        const updatedEng = `Category EN Updated ${suffix}`
        createdCategoryNamesPln.push(namePln, updatedPln)

        const createResult = await createCategory(
            initialCategoryFormState,
            makeFormData({ namePln: `  ${namePln}  `, nameEng })
        )
        expect(createResult.status).toBe("success")
        expect(createResult.fieldErrors).toEqual({})

        const duplicateResult = await createCategory(
            initialCategoryFormState,
            makeFormData({ namePln, nameEng: `Other ${suffix}` })
        )
        expect(duplicateResult).toEqual({
            status: "error",
            fieldErrors: {
                namePln: "Kategoria o takiej nazwie już istnieje.",
            },
        })

        const created = await db.query.categories.findFirst({
            where: eq(categories.namePln, namePln),
        })
        expect(created).toBeDefined()

        const updateResult = await updateCategory(
            initialCategoryFormState,
            makeFormData({
                categoryId: created!.categoryId,
                namePln: updatedPln,
                nameEng: updatedEng,
            })
        )
        expect(updateResult.status).toBe("success")

        const updated = await db.query.categories.findFirst({
            where: eq(categories.categoryId, created!.categoryId),
        })
        expect(updated?.namePln).toBe(updatedPln)
        expect(updated?.nameEng).toBe(updatedEng)
    })

    test("blocks deleting a category with assigned works until works are removed", async () => {
        const namePln = `Kategoria Z Pracami ${suffix}`
        const nameEng = `Category With Works ${suffix}`
        createdCategoryNamesPln.push(namePln)

        await createCategory(initialCategoryFormState, makeFormData({ namePln, nameEng }))
        const category = await db.query.categories.findFirst({
            where: eq(categories.namePln, namePln),
        })
        expect(category).toBeDefined()

        const [artwork] = await db
            .insert(artPieces)
            .values({
                categoryId: category!.categoryId,
                titlePln: `Praca testowa ${suffix}`,
                isVisible: true,
            })
            .returning()
        createdArtworkIds.push(artwork.artPieceId)

        const blockedDelete = await deleteCategory(category!.categoryId)
        expect(blockedDelete).toEqual({
            status: "error",
            error: "Nie można usunąć kategorii, do której są przypisane prace.",
        })

        await db.delete(artPieces).where(eq(artPieces.artPieceId, artwork.artPieceId))

        const allowedDelete = await deleteCategory(category!.categoryId)
        expect(allowedDelete).toEqual({ status: "success" })

        const remaining = await db.query.categories.findFirst({
            where: eq(categories.categoryId, category!.categoryId),
        })
        expect(remaining).toBeUndefined()
    })

    test("creates tags stripping leading '#', blocks duplicates, and deletes tags", async () => {
        const namePln = `tag_pl_${suffix}`
        const nameEng = `tag_en_${suffix}`
        createdTagNamesPln.push(namePln)

        const createResult = await createTag(
            initialTagFormState,
            makeFormData({
                namePln: `  #${namePln} `,
                nameEng: `##${nameEng}`,
            })
        )
        expect(createResult.status).toBe("success")

        const savedTag = await db.query.tags.findFirst({
            where: eq(tags.namePln, namePln),
        })
        expect(savedTag).toBeDefined()
        expect(savedTag?.nameEng).toBe(nameEng)

        const duplicateResult = await createTag(
            initialTagFormState,
            makeFormData({
                namePln: namePln.toUpperCase(),
                nameEng: `other_${suffix}`,
            })
        )
        expect(duplicateResult).toEqual({
            status: "error",
            fieldErrors: {
                namePln: "Tag o takiej nazwie już istnieje.",
            },
        })

        await deleteTag(savedTag!.tagId)

        const afterDelete = await db.query.tags.findFirst({
            where: eq(tags.tagId, savedTag!.tagId),
        })
        expect(afterDelete).toBeUndefined()
    })
})
