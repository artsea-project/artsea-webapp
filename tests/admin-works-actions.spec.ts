import { randomUUID } from "node:crypto"

import { expect, test } from "@playwright/test"
import { eq, inArray } from "drizzle-orm"

import { createWork, deleteWork, setWorkVisibility, updateWork } from "../app/admin/works/actions"
import { db } from "../db"
import { artPieces, artPieceTags, categories, tags } from "../db/schema"
import { initialWorkFormState } from "../lib/works/form-state"
import { getWorkForEdit } from "../lib/works/queries"

const suffix = randomUUID().slice(0, 8)
const marker = `acttest${suffix}`
let categoryId: string
let tagIdA: string
let tagIdB: string
const createdArtworkIds: string[] = []

function makeFormData(entries: Record<string, string | string[]>): FormData {
    const formData = new FormData()
    for (const [key, value] of Object.entries(entries)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                formData.append(key, item)
            }
        } else {
            formData.set(key, value)
        }
    }
    return formData
}

test.beforeAll(async () => {
    const [category] = await db
        .insert(categories)
        .values({ namePln: `${marker} kat`, nameEng: `${marker} cat` })
        .returning({ categoryId: categories.categoryId })
    categoryId = category.categoryId

    const [tagA, tagB] = await db
        .insert(tags)
        .values([
            { namePln: `${marker}tagA`, nameEng: null },
            { namePln: `${marker}tagB`, nameEng: null },
        ])
        .returning({ tagId: tags.tagId })
    tagIdA = tagA.tagId
    tagIdB = tagB.tagId
})

test.afterAll(async () => {
    if (createdArtworkIds.length > 0) {
        await db.delete(artPieces).where(inArray(artPieces.artPieceId, createdArtworkIds))
    }
    await db.delete(tags).where(inArray(tags.tagId, [tagIdA, tagIdB]))
    await db.delete(categories).where(eq(categories.categoryId, categoryId))
})

test.describe("works server actions", () => {
    test("returns validation errors when inputs are invalid", async () => {
        const emptyState = await createWork(
            initialWorkFormState,
            makeFormData({
                titlePln: "   ",
                titleEng: "",
                yearOfExecution: "999",
                categoryId: "not-a-uuid",
                tagIds: ["bad-tag"],
            })
        )
        expect(emptyState).toEqual({
            status: "error",
            fieldErrors: {
                titlePln: "Podaj tytuł pracy w przynajmniej jednym języku.",
                yearOfExecution: `Podaj rok w zakresie 1000-${new Date().getFullYear() + 1}.`,
                categoryId: "Wybierz kategorię pracy.",
            },
            formError: "Nieprawidłowy identyfikator tagu.",
        })

        const invalidUpdate = await updateWork(
            initialWorkFormState,
            makeFormData({
                artPieceId: "not-a-uuid",
                titlePln: "Tytuł",
                categoryId,
            })
        )
        expect(invalidUpdate).toEqual({
            status: "error",
            fieldErrors: {},
            formError: "Nieprawidłowy identyfikator pracy.",
        })

        expect(await setWorkVisibility("not-a-uuid", false)).toEqual({
            status: "error",
            error: "Nieprawidłowy identyfikator pracy.",
        })

        expect(await deleteWork("not-a-uuid")).toEqual({
            status: "error",
            error: "Nieprawidłowy identyfikator pracy.",
        })
    })

    test("creates, updates, toggles visibility, and deletes a work", async () => {
        const createResult = await createWork(
            initialWorkFormState,
            makeFormData({
                titlePln: `  ${marker} Tytuł PL  `,
                titleEng: "",
                yearOfExecution: "2024",
                techniquePln: " Olej na płótnie ",
                descriptionPln: " Opis pracy ",
                categoryId,
                tagIds: [tagIdA, tagIdA],
            })
        )
        expect(createResult.status).toBe("success")
        expect(createResult.workId).toBeDefined()
        const workId = createResult.workId!
        createdArtworkIds.push(workId)

        const created = await getWorkForEdit(workId)
        expect(created).toMatchObject({
            artPieceId: workId,
            categoryId,
            isVisible: true,
            titlePln: `${marker} Tytuł PL`,
            titleEng: "",
            yearOfExecution: 2024,
            descriptionPln: { technique: "Olej na płótnie", description: "Opis pracy" },
            descriptionEng: { technique: "", description: "" },
            tagIds: [tagIdA],
        })

        const updateResult = await updateWork(
            initialWorkFormState,
            makeFormData({
                artPieceId: workId,
                titlePln: "",
                titleEng: `${marker} Title EN`,
                yearOfExecution: "",
                techniqueEng: "Acrylic",
                descriptionEng: "English description",
                categoryId,
                tagIds: [tagIdB],
            })
        )
        expect(updateResult.status).toBe("success")

        const updated = await getWorkForEdit(workId)
        expect(updated).toMatchObject({
            titlePln: "",
            titleEng: `${marker} Title EN`,
            yearOfExecution: null,
            descriptionPln: { technique: "", description: "" },
            descriptionEng: { technique: "Acrylic", description: "English description" },
            tagIds: [tagIdB],
        })

        expect(await setWorkVisibility(workId, false)).toEqual({ status: "success" })
        const hidden = await getWorkForEdit(workId)
        expect(hidden?.isVisible).toBe(false)

        expect(await deleteWork(workId)).toEqual({ status: "success" })
        expect(await getWorkForEdit(workId)).toBeNull()

        const remainingTags = await db
            .select()
            .from(artPieceTags)
            .where(eq(artPieceTags.artPieceId, workId))
        expect(remainingTags).toHaveLength(0)

        expect(await deleteWork(workId)).toEqual({
            status: "error",
            error: "Ta praca została już usunięta.",
        })
        expect(await setWorkVisibility(workId, true)).toEqual({
            status: "error",
            error: "Ta praca została już usunięta.",
        })
    })

    test("handles missing foreign keys and missing work on update", async () => {
        const missingCategory = await createWork(
            initialWorkFormState,
            makeFormData({
                titlePln: `${marker} brak kategorii`,
                categoryId: randomUUID(),
            })
        )
        expect(missingCategory).toEqual({
            status: "error",
            fieldErrors: {
                categoryId: "Wybrana kategoria nie istnieje.",
            },
        })

        const missingTag = await createWork(
            initialWorkFormState,
            makeFormData({
                titlePln: `${marker} brak tagu`,
                categoryId,
                tagIds: [randomUUID()],
            })
        )
        expect(missingTag).toEqual({
            status: "error",
            fieldErrors: {},
            formError: "Jeden z wybranych tagów nie istnieje.",
        })

        const missingWork = await updateWork(
            initialWorkFormState,
            makeFormData({
                artPieceId: randomUUID(),
                titlePln: "Tytuł",
                categoryId,
            })
        )
        expect(missingWork).toEqual({
            status: "error",
            fieldErrors: {},
            formError: "Ta praca została już usunięta.",
        })
    })
})
