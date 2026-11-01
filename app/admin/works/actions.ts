"use server"

import { eq } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { artPieces, artPieceTags } from "@/db/schema"
import { BENTO_CACHE_TAG } from "@/lib/bento"
import { buildWorkDescription } from "@/lib/works/description"
import type { WorkField, WorkFormState } from "@/lib/works/form-state"
import {
    checkDescription,
    checkTechnique,
    checkWorkCategory,
    checkWorkTitles,
    checkYearOfExecution,
    isUuid,
    parseTagIds,
    parseYearOfExecution,
} from "@/lib/works/validation"

type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export type DeleteWorkResult = { status: "success" } | { status: "error"; error: string }
export type SetWorkVisibilityResult = { status: "success" } | { status: "error"; error: string }

function readText(formData: FormData, name: string): string {
    const value = formData.get(name)
    return typeof value === "string" ? value : ""
}

function readTextList(formData: FormData, name: string): string[] {
    return formData.getAll(name).filter((value): value is string => typeof value === "string")
}

function failed<Field extends string>(fieldErrors: FieldErrors<Field>, formError?: string) {
    return formError
        ? { status: "error" as const, fieldErrors, formError }
        : { status: "error" as const, fieldErrors }
}

function succeeded(workId?: string) {
    return { status: "success" as const, fieldErrors: {}, savedAt: Date.now(), workId }
}

function getPostgresErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined
    if ("code" in error && typeof error.code === "string") return error.code
    if ("cause" in error) return getPostgresErrorCode(error.cause)
    return undefined
}

function getPostgresConstraintName(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined
    if ("constraint" in error && typeof error.constraint === "string") return error.constraint
    if ("cause" in error) return getPostgresConstraintName(error.cause)
    return undefined
}

function refreshViews(artPieceId?: string) {
    try {
        revalidatePath("/admin/works")
        revalidatePath("/admin/categories")
        revalidatePath("/")
        if (artPieceId) revalidatePath(`/work/${artPieceId}`)
        revalidateTag(BENTO_CACHE_TAG, "max")
    } catch {
        // Ignored when executed outside the Next.js request context (e.g. integration tests)
    }
}

function readWork(formData: FormData) {
    const rawTitlePln = readText(formData, "titlePln")
    const rawTitleEng = readText(formData, "titleEng")
    const rawYear = readText(formData, "yearOfExecution")
    const rawTechniquePln = readText(formData, "techniquePln")
    const rawTechniqueEng = readText(formData, "techniqueEng")
    const rawDescriptionPln = readText(formData, "descriptionPln")
    const rawDescriptionEng = readText(formData, "descriptionEng")
    const categoryId = readText(formData, "categoryId").trim()
    const rawTagIds = readTextList(formData, "tagIds")

    const titleError = checkWorkTitles(rawTitlePln, rawTitleEng)
    const yearError = checkYearOfExecution(rawYear)
    const categoryError = checkWorkCategory(categoryId)
    const techniquePlnError = checkTechnique(rawTechniquePln)
    const techniqueEngError = checkTechnique(rawTechniqueEng)
    const descriptionPlnError = checkDescription(rawDescriptionPln)
    const descriptionEngError = checkDescription(rawDescriptionEng)
    const parsedTags = parseTagIds(rawTagIds)

    const fieldErrors: FieldErrors<WorkField> = {
        ...(titleError ? { titlePln: titleError } : {}),
        ...(yearError ? { yearOfExecution: yearError } : {}),
        ...(categoryError ? { categoryId: categoryError } : {}),
        ...(techniquePlnError ? { techniquePln: techniquePlnError } : {}),
        ...(techniqueEngError ? { techniqueEng: techniqueEngError } : {}),
        ...(descriptionPlnError ? { descriptionPln: descriptionPlnError } : {}),
        ...(descriptionEngError ? { descriptionEng: descriptionEngError } : {}),
    }

    const formError = "error" in parsedTags ? parsedTags.error : undefined
    if (Object.keys(fieldErrors).length > 0 || formError) {
        return { fieldErrors, formError }
    }

    const titlePln = rawTitlePln.trim() || null
    const titleEng = rawTitleEng.trim() || null

    return {
        values: {
            categoryId,
            titlePln,
            titleEng,
            yearOfExecution: parseYearOfExecution(rawYear),
            descriptionPln: buildWorkDescription(rawTechniquePln, rawDescriptionPln),
            descriptionEng: buildWorkDescription(rawTechniqueEng, rawDescriptionEng),
        },
        tagIds: "tagIds" in parsedTags ? parsedTags.tagIds : [],
    }
}

function handleForeignKeyFailure(error: unknown): WorkFormState {
    const constraint = getPostgresConstraintName(error)
    if (constraint === "art_piece_category_fk") {
        return failed({ categoryId: "Wybrana kategoria nie istnieje." })
    }
    if (constraint === "art_piece_tags_tag_fk") {
        return failed({}, "Jeden z wybranych tagów nie istnieje.")
    }
    return failed({}, "Nie udało się zapisać pracy. Spróbuj ponownie.")
}

export async function createWork(
    _previous: WorkFormState,
    formData: FormData
): Promise<WorkFormState> {
    const work = readWork(formData)
    if (!work.values) return failed(work.fieldErrors, work.formError)

    let createdId: string
    try {
        createdId = await db.transaction(async (tx) => {
            const [created] = await tx
                .insert(artPieces)
                .values(work.values)
                .returning({ artPieceId: artPieces.artPieceId })

            if (work.tagIds.length > 0) {
                await tx
                    .insert(artPieceTags)
                    .values(work.tagIds.map((tagId) => ({ artPieceId: created.artPieceId, tagId })))
            }

            return created.artPieceId
        })
    } catch (error) {
        if (getPostgresErrorCode(error) === "23503") {
            return handleForeignKeyFailure(error)
        }
        throw error
    }

    refreshViews(createdId)
    return succeeded(createdId)
}

export async function updateWork(
    _previous: WorkFormState,
    formData: FormData
): Promise<WorkFormState> {
    const artPieceId = readText(formData, "artPieceId").trim()
    if (!isUuid(artPieceId)) {
        return failed({}, "Nieprawidłowy identyfikator pracy.")
    }

    const work = readWork(formData)
    if (!work.values) return failed(work.fieldErrors, work.formError)

    let updatedCount: number
    try {
        updatedCount = await db.transaction(async (tx) => {
            const updated = await tx
                .update(artPieces)
                .set(work.values)
                .where(eq(artPieces.artPieceId, artPieceId))
                .returning({ artPieceId: artPieces.artPieceId })

            if (updated.length === 0) return 0

            await tx.delete(artPieceTags).where(eq(artPieceTags.artPieceId, artPieceId))
            if (work.tagIds.length > 0) {
                await tx
                    .insert(artPieceTags)
                    .values(work.tagIds.map((tagId) => ({ artPieceId, tagId })))
            }

            return updated.length
        })
    } catch (error) {
        if (getPostgresErrorCode(error) === "23503") {
            return handleForeignKeyFailure(error)
        }
        throw error
    }

    refreshViews(artPieceId)
    if (updatedCount === 0) {
        return failed({}, "Ta praca została już usunięta.")
    }
    return succeeded(artPieceId)
}

export async function setWorkVisibility(
    artPieceId: string,
    isVisible: boolean
): Promise<SetWorkVisibilityResult> {
    if (!isUuid(artPieceId)) {
        return { status: "error", error: "Nieprawidłowy identyfikator pracy." }
    }
    if (typeof isVisible !== "boolean") {
        return { status: "error", error: "Nieprawidłowa wartość widoczności." }
    }

    let updated: { artPieceId: string }[]
    try {
        updated = await db
            .update(artPieces)
            .set({ isVisible })
            .where(eq(artPieces.artPieceId, artPieceId))
            .returning({ artPieceId: artPieces.artPieceId })
    } catch {
        return {
            status: "error",
            error: "Nie udało się zmienić widoczności pracy. Spróbuj ponownie.",
        }
    }

    refreshViews(artPieceId)
    if (updated.length === 0) {
        return { status: "error", error: "Ta praca została już usunięta." }
    }
    return { status: "success" }
}

export async function deleteWork(artPieceId: string): Promise<DeleteWorkResult> {
    if (!isUuid(artPieceId)) {
        return { status: "error", error: "Nieprawidłowy identyfikator pracy." }
    }

    let deleted: { artPieceId: string }[]
    try {
        deleted = await db
            .delete(artPieces)
            .where(eq(artPieces.artPieceId, artPieceId))
            .returning({ artPieceId: artPieces.artPieceId })
    } catch {
        return { status: "error", error: "Nie udało się usunąć pracy. Spróbuj ponownie." }
    }

    refreshViews(artPieceId)
    if (deleted.length === 0) {
        return { status: "error", error: "Ta praca została już usunięta." }
    }
    return { status: "success" }
}
