"use server"

import { count, eq } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { artPieces, categories, tags } from "@/db/schema"
import { BENTO_CACHE_TAG } from "@/lib/bento"
import type {
    CategoryField,
    CategoryFormState,
    TagField,
    TagFormState,
} from "@/lib/categories/form-state"
import {
    checkCategoryNameEng,
    checkCategoryNamePln,
    checkTagNameEng,
    checkTagNamePln,
    normalizeTagName,
} from "@/lib/categories/validation"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export type DeleteCategoryResult = { status: "success" } | { status: "error"; error: string }

function readText(formData: FormData, name: string): string {
    const value = formData.get(name)
    return typeof value === "string" ? value : ""
}

function failed<Field extends string>(fieldErrors: FieldErrors<Field>) {
    return { status: "error" as const, fieldErrors }
}

function succeeded() {
    return { status: "success" as const, fieldErrors: {}, savedAt: Date.now() }
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
    const [existingPln, existingEng] = await Promise.all([
        db.query.categories.findFirst({
            where: (fields, { and, ilike, ne }) =>
                excludeId
                    ? and(ilike(fields.namePln, namePln), ne(fields.categoryId, excludeId))
                    : ilike(fields.namePln, namePln),
        }),
        db.query.categories.findFirst({
            where: (fields, { and, ilike, ne }) =>
                excludeId
                    ? and(ilike(fields.nameEng, nameEng), ne(fields.categoryId, excludeId))
                    : ilike(fields.nameEng, nameEng),
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

    await db.insert(categories).values(category.values)

    refreshViews()
    return succeeded()
}

export async function updateCategory(
    _previous: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    const categoryId = readText(formData, "categoryId")
    if (!UUID_PATTERN.test(categoryId)) return failed({})

    const category = readCategory(formData)
    if (!category.values) return failed(category.fieldErrors)

    const conflicts = await findCategoryConflicts(
        category.values.namePln,
        category.values.nameEng,
        categoryId
    )
    if (conflicts.namePln || conflicts.nameEng) return failed(conflicts)

    const updated = await db
        .update(categories)
        .set(category.values)
        .where(eq(categories.categoryId, categoryId))
        .returning({ categoryId: categories.categoryId })

    refreshViews()
    if (updated.length === 0) {
        return failed<CategoryField>({ namePln: "Ta kategoria została już usunięta." })
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

    await db.delete(categories).where(eq(categories.categoryId, categoryId))
    refreshViews()
    return { status: "success" }
}

function readTag(formData: FormData) {
    const rawPln = readText(formData, "namePln")
    const rawEng = readText(formData, "nameEng")

    const plnError = checkTagNamePln(rawPln)
    const engError = checkTagNameEng(rawEng)

    if (plnError || engError) {
        const fieldErrors: FieldErrors<TagField> = {
            namePln: plnError ?? undefined,
            nameEng: engError ?? undefined,
        }
        return { fieldErrors }
    }

    return {
        values: {
            namePln: normalizeTagName(rawPln),
            nameEng: normalizeTagName(rawEng),
        },
    }
}

export async function createTag(
    _previous: TagFormState,
    formData: FormData
): Promise<TagFormState> {
    const tag = readTag(formData)
    if (!tag.values) return failed(tag.fieldErrors)

    const [existingPln, existingEng] = await Promise.all([
        db.query.tags.findFirst({
            where: (fields, { ilike }) => ilike(fields.namePln, tag.values.namePln),
        }),
        db.query.tags.findFirst({
            where: (fields, { ilike }) => ilike(fields.nameEng, tag.values.nameEng),
        }),
    ])

    if (existingPln || existingEng) {
        return failed<TagField>({
            namePln: existingPln ? "Tag o takiej nazwie już istnieje." : undefined,
            nameEng: existingEng ? "Tag o takiej nazwie już istnieje." : undefined,
        })
    }

    await db.insert(tags).values(tag.values)

    refreshViews()
    return succeeded()
}

export async function deleteTag(tagId: string): Promise<void> {
    if (!UUID_PATTERN.test(tagId)) return

    await db.delete(tags).where(eq(tags.tagId, tagId))
    refreshViews()
}
