"use server"

import { and, eq, ne, sql, type AnyColumn, type SQL } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { categories, tags } from "@/db/schema"
import { BENTO_CACHE_TAG } from "@/lib/bento"
import type {
    BilingualNameField,
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

const CATEGORY_SAVE_ERROR = "Nie udało się zapisać kategorii. Spróbuj ponownie."
const TAG_SAVE_ERROR = "Nie udało się zapisać tagu. Spróbuj ponownie."

type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export type DeleteResult = { status: "success" } | { status: "error"; error: string }
export type DeleteCategoryResult = DeleteResult
export type DeleteTagResult = DeleteResult

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

function failedConflict(fieldErrors: FieldErrors<BilingualNameField>, fallbackError: string) {
    const hasFieldErrors = Boolean(fieldErrors.namePln || fieldErrors.nameEng)
    return failed(fieldErrors, hasFieldErrors ? undefined : fallbackError)
}

function succeeded(extra?: string | { categoryId?: string; tagId?: string }) {
    if (!extra) {
        return { status: "success" as const, fieldErrors: {}, savedAt: Date.now() }
    }
    const id = typeof extra === "string" ? extra : (extra.categoryId ?? extra.tagId)
    const categoryId = typeof extra === "string" ? extra : extra.categoryId
    const tagId = typeof extra === "string" ? extra : extra.tagId

    return {
        status: "success" as const,
        fieldErrors: {},
        savedAt: Date.now(),
        ...(categoryId ? { categoryId } : {}),
        ...(tagId ? { tagId } : {}),
        ...(id ? { createdId: id } : {}),
    }
}

function getPostgresErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined
    if ("code" in error && typeof error.code === "string") return error.code
    if ("cause" in error) return getPostgresErrorCode(error.cause)
    return undefined
}

function isOutsideRequestContextError(error: unknown): boolean {
    return (
        error instanceof Error &&
        typeof error.message === "string" &&
        error.message.includes("static generation store missing")
    )
}

function refreshViews() {
    try {
        revalidatePath("/admin/categories")
        revalidatePath("/admin/works", "layout")
        revalidatePath("/")
        revalidateTag(BENTO_CACHE_TAG, "max")
    } catch (error) {
        if (!isOutsideRequestContextError(error)) {
            console.error("Failed to revalidate cache:", error)
        }
    }
}

async function hasMatchingRow(
    table: typeof categories | typeof tags,
    condition: SQL | undefined
): Promise<boolean> {
    const rows = await db
        .select({ one: sql`1` })
        .from(table)
        .where(condition)
        .limit(1)
    return rows.length > 0
}

interface ConflictCheckConfig {
    table: typeof categories | typeof tags
    idColumn: AnyColumn
    namePlnColumn: AnyColumn
    nameEngColumn: AnyColumn
    duplicateMessage: string
}

async function findNameConflicts(
    config: ConflictCheckConfig,
    values: { namePln: string; nameEng: string },
    excludeId?: string
): Promise<FieldErrors<BilingualNameField>> {
    const notSelf = excludeId ? ne(config.idColumn, excludeId) : undefined

    const [existingPln, existingEng] = await Promise.all([
        hasMatchingRow(
            config.table,
            and(equalsIgnoreCase(config.namePlnColumn, values.namePln), notSelf)
        ),
        hasMatchingRow(
            config.table,
            and(equalsIgnoreCase(config.nameEngColumn, values.nameEng), notSelf)
        ),
    ])

    const fieldErrors: FieldErrors<BilingualNameField> = {}
    if (existingPln) fieldErrors.namePln = config.duplicateMessage
    if (existingEng) fieldErrors.nameEng = config.duplicateMessage
    return fieldErrors
}

const categoryConflictConfig: ConflictCheckConfig = {
    table: categories,
    idColumn: categories.categoryId,
    namePlnColumn: categories.namePln,
    nameEngColumn: categories.nameEng,
    duplicateMessage: "Kategoria o takiej nazwie już istnieje.",
}

const tagConflictConfig: ConflictCheckConfig = {
    table: tags,
    idColumn: tags.tagId,
    namePlnColumn: tags.namePln,
    nameEngColumn: tags.nameEng,
    duplicateMessage: "Tag o takiej nazwie już istnieje.",
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
    return findNameConflicts(categoryConflictConfig, { namePln, nameEng }, excludeId)
}

export async function createCategory(
    _previous: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    const category = readCategory(formData)
    if (!category.values) return failed(category.fieldErrors)

    const conflicts = await findCategoryConflicts(category.values.namePln, category.values.nameEng)
    if (conflicts.namePln || conflicts.nameEng) return failed(conflicts)

    let createdId: string
    try {
        const [created] = await db
            .insert(categories)
            .values(category.values)
            .returning({ categoryId: categories.categoryId })
        createdId = created.categoryId
    } catch (error) {
        if (getPostgresErrorCode(error) === "23505") {
            const raceConflicts = await findCategoryConflicts(
                category.values.namePln,
                category.values.nameEng
            )
            return failedConflict(raceConflicts, CATEGORY_SAVE_ERROR)
        }
        throw error
    }

    refreshViews()
    return succeeded({ categoryId: createdId })
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
            return failedConflict(raceConflicts, CATEGORY_SAVE_ERROR)
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

async function findTagConflicts(
    values: { namePln: string; nameEng: string },
    excludeId?: string
): Promise<FieldErrors<TagField>> {
    return findNameConflicts(tagConflictConfig, values, excludeId)
}

export async function createTag(
    _previous: TagFormState,
    formData: FormData
): Promise<TagFormState> {
    const tag = readTag(formData)
    if (!tag.values) return failed(tag.fieldErrors)

    const conflicts = await findTagConflicts(tag.values)
    if (conflicts.namePln || conflicts.nameEng) return failed(conflicts)

    let createdId: string
    try {
        const [created] = await db.insert(tags).values(tag.values).returning({ tagId: tags.tagId })
        createdId = created.tagId
    } catch (error) {
        if (getPostgresErrorCode(error) === "23505") {
            return failedConflict(await findTagConflicts(tag.values), TAG_SAVE_ERROR)
        }
        throw error
    }

    refreshViews()
    return succeeded({ tagId: createdId })
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
    if (!tag.values) return failed(tag.fieldErrors)

    const conflicts = await findTagConflicts(tag.values, tagId)
    if (conflicts.namePln || conflicts.nameEng) return failed(conflicts)

    let updated: { tagId: string }[]
    try {
        updated = await db
            .update(tags)
            .set(tag.values)
            .where(eq(tags.tagId, tagId))
            .returning({ tagId: tags.tagId })
    } catch (error) {
        if (getPostgresErrorCode(error) === "23505") {
            return failedConflict(await findTagConflicts(tag.values, tagId), TAG_SAVE_ERROR)
        }
        throw error
    }

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

    let deleted: { tagId: string }[]
    try {
        deleted = await db
            .delete(tags)
            .where(eq(tags.tagId, tagId))
            .returning({ tagId: tags.tagId })
    } catch {
        return { status: "error", error: "Nie udało się usunąć tagu. Spróbuj ponownie." }
    }

    refreshViews()
    if (deleted.length === 0) {
        return { status: "error", error: "Ten tag został już usunięty." }
    }
    return { status: "success" }
}
