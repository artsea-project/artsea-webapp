"use server"

import { and, count, eq, ne, sql, type AnyColumn } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { artPieces, categories, tags } from "@/db/schema"
import { BENTO_CACHE_TAG } from "@/lib/bento"
import type { CategoryField, CategoryFormState, TagFormState } from "@/lib/categories/form-state"
import {
    checkCategoryNameEng,
    checkCategoryNamePln,
    checkTagNames,
    normalizeTagName,
} from "@/lib/categories/validation"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export type DeleteCategoryResult = { status: "success" } | { status: "error"; error: string }
export type DeleteTagResult = { status: "success" } | { status: "error"; error: string }

function readText(formData: FormData, name: string): string {
    const value = formData.get(name)
    return typeof value === "string" ? value : ""
}

function equalsIgnoreCase(column: AnyColumn, value: string) {
    return sql`lower(${column}) = lower(${value})`
}

function failed<Field extends string>(fieldErrors: FieldErrors<Field>, formError?: string) {
    return formError
        ? { status: "error" as const, fieldErrors, formError }
        : { status: "error" as const, fieldErrors }
}

function succeeded() {
    return { status: "success" as const, fieldErrors: {}, savedAt: Date.now() }
}

function getPostgresErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined
    if ("code" in error && typeof error.code === "string") return error.code
    if ("cause" in error) return getPostgresErrorCode(error.cause)
    return undefined
}

function refreshViews() {
    try {
        revalidatePath("/admin/categories")
        revalidatePath("/admin/works")
        revalidatePath("/")
        revalidateTag(BENTO_CACHE_TAG, "max")
    } catch {
        // Ignored when executed outside the Next.js request context (e.g. integration tests)
    }
}

function readCategory(formData: FormData) {
    const namePln = readText(formData, "namePln")
    const nameEng = readText(formData, "nameEng")

    const plnError = checkCategoryNamePln(namePln)
    const engError = checkCategoryNameEng(nameEng)

    if (plnError || engError) {
        const fieldErrors: FieldErrors<CategoryField> = {
            namePln: plnError ?? undefined,
            nameEng: engError ?? undefined,
        }
        return { fieldErrors }
    }

    return {
        values: {
            namePln: namePln.trim(),
            nameEng: nameEng.trim(),
        },
    }
}

async function findCategoryConflicts(
    namePln: string,
    nameEng: string,
    excludeId?: string
): Promise<FieldErrors<CategoryField>> {
    const notSelf = excludeId ? ne(categories.categoryId, excludeId) : undefined

    const [existingPln, existingEng] = await Promise.all([
        db.query.categories.findFirst({
            where: and(equalsIgnoreCase(categories.namePln, namePln), notSelf),
        }),
        db.query.categories.findFirst({
            where: and(equalsIgnoreCase(categories.nameEng, nameEng), notSelf),
        }),
    ])

    const fieldErrors: FieldErrors<CategoryField> = {}
    if (existingPln) fieldErrors.namePln = "Kategoria o takiej nazwie już istnieje."
    if (existingEng) fieldErrors.nameEng = "Kategoria o takiej nazwie już istnieje."
    return fieldErrors
}

export async function createCategory(
    _previous: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    const category = readCategory(formData)
    if (!category.values) return failed(category.fieldErrors)

    const conflicts = await findCategoryConflicts(category.values.namePln, category.values.nameEng)
    if (conflicts.namePln || conflicts.nameEng) return failed(conflicts)

    try {
        await db.insert(categories).values(category.values)
    } catch (error) {
        if (getPostgresErrorCode(error) === "23505") {
            const raceConflicts = await findCategoryConflicts(
                category.values.namePln,
                category.values.nameEng
            )
            return failed(raceConflicts)
        }
        throw error
    }

    refreshViews()
    return succeeded()
}

export async function updateCategory(
    _previous: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    const categoryId = readText(formData, "categoryId")
    if (!UUID_PATTERN.test(categoryId)) {
        return failed({}, "Nieprawidłowy identyfikator kategorii.")
    }

    const category = readCategory(formData)
    if (!category.values) return failed(category.fieldErrors)

    const conflicts = await findCategoryConflicts(
        category.values.namePln,
        category.values.nameEng,
        categoryId
    )
    if (conflicts.namePln || conflicts.nameEng) return failed(conflicts)

    let updated: { categoryId: string }[]
    try {
        updated = await db
            .update(categories)
            .set(category.values)
            .where(eq(categories.categoryId, categoryId))
            .returning({ categoryId: categories.categoryId })
    } catch (error) {
        if (getPostgresErrorCode(error) === "23505") {
            const raceConflicts = await findCategoryConflicts(
                category.values.namePln,
                category.values.nameEng,
                categoryId
            )
            return failed(raceConflicts)
        }
        throw error
    }

    refreshViews()
    if (updated.length === 0) {
        return failed({}, "Ta kategoria została już usunięta.")
    }
    return succeeded()
}

export async function deleteCategory(categoryId: string): Promise<DeleteCategoryResult> {
    if (!UUID_PATTERN.test(categoryId)) {
        return { status: "error", error: "Nieprawidłowy identyfikator kategorii." }
    }

    const [{ value: assignedCount }] = await db
        .select({ value: count() })
        .from(artPieces)
        .where(eq(artPieces.categoryId, categoryId))

    if (Number(assignedCount) > 0) {
        return {
            status: "error",
            error: "Nie można usunąć kategorii, do której są przypisane prace.",
        }
    }

    try {
        await db.delete(categories).where(eq(categories.categoryId, categoryId))
    } catch (error) {
        if (getPostgresErrorCode(error) === "23503") {
            return {
                status: "error",
                error: "Nie można usunąć kategorii, do której są przypisane prace.",
            }
        }
        throw error
    }

    refreshViews()
    return { status: "success" }
}

function readTag(formData: FormData) {
    const rawPln = readText(formData, "namePln")
    const rawEng = readText(formData, "nameEng")

    const validationError = checkTagNames(rawPln, rawEng)
    if (validationError) {
        return { formError: validationError }
    }

    const normalizedPln = normalizeTagName(rawPln)
    const normalizedEng = normalizeTagName(rawEng)

    return {
        values: {
            namePln: normalizedPln || null,
            nameEng: normalizedEng || null,
        },
    }
}

export async function createTag(
    _previous: TagFormState,
    formData: FormData
): Promise<TagFormState> {
    const tag = readTag(formData)
    if (!tag.values) {
        return failed({}, tag.formError)
    }

    const [existingPln, existingEng] = await Promise.all([
        tag.values.namePln
            ? db.query.tags.findFirst({
                  where: equalsIgnoreCase(tags.namePln, tag.values.namePln),
              })
            : Promise.resolve(undefined),
        tag.values.nameEng
            ? db.query.tags.findFirst({
                  where: equalsIgnoreCase(tags.nameEng, tag.values.nameEng),
              })
            : Promise.resolve(undefined),
    ])

    if (existingPln || existingEng) {
        return failed({
            namePln: existingPln ? "Tag o takiej nazwie już istnieje." : undefined,
            nameEng: existingEng ? "Tag o takiej nazwie już istnieje." : undefined,
        })
    }

    await db.insert(tags).values(tag.values)

    refreshViews()
    return succeeded()
}

export async function updateTag(
    _previous: TagFormState,
    formData: FormData
): Promise<TagFormState> {
    const tagId = readText(formData, "tagId")
    if (!UUID_PATTERN.test(tagId)) {
        return failed({}, "Nieprawidłowy identyfikator tagu.")
    }

    const tag = readTag(formData)
    if (!tag.values) {
        return failed({}, tag.formError)
    }

    const notSelf = ne(tags.tagId, tagId)
    const [existingPln, existingEng] = await Promise.all([
        tag.values.namePln
            ? db.query.tags.findFirst({
                  where: and(equalsIgnoreCase(tags.namePln, tag.values.namePln), notSelf),
              })
            : Promise.resolve(undefined),
        tag.values.nameEng
            ? db.query.tags.findFirst({
                  where: and(equalsIgnoreCase(tags.nameEng, tag.values.nameEng), notSelf),
              })
            : Promise.resolve(undefined),
    ])

    if (existingPln || existingEng) {
        return failed({
            namePln: existingPln ? "Tag o takiej nazwie już istnieje." : undefined,
            nameEng: existingEng ? "Tag o takiej nazwie już istnieje." : undefined,
        })
    }

    const updated = await db
        .update(tags)
        .set(tag.values)
        .where(eq(tags.tagId, tagId))
        .returning({ tagId: tags.tagId })

    refreshViews()
    if (updated.length === 0) {
        return failed({}, "Ten tag został już usunięty.")
    }
    return succeeded()
}

export async function deleteTag(tagId: string): Promise<DeleteTagResult> {
    if (!UUID_PATTERN.test(tagId)) {
        return { status: "error", error: "Nieprawidłowy identyfikator tagu." }
    }

    await db.delete(tags).where(eq(tags.tagId, tagId))
    refreshViews()
    return { status: "success" }
}
