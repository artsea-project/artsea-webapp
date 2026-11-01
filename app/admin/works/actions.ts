"use server"

import { createHash } from "node:crypto"

import { and, eq, notInArray } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"

import { db } from "@/db"
import { artPieces, artPieceTags, media } from "@/db/schema"
import { BENTO_CACHE_TAG } from "@/lib/bento"
import { buildWorkDescription } from "@/lib/works/description"
import type { WorkField, WorkFormState } from "@/lib/works/form-state"
import {
    checkWorkCategory,
    checkWorkTitles,
    checkYearOfExecution,
    isUuid,
    MAX_MEDIA_FILE_BYTES,
    parseTagIds,
    parseYearOfExecution,
    resolveUploadedFileType,
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
    const rawDimensions = readText(formData, "dimensions")
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
    const parsedTags = parseTagIds(rawTagIds)

    const fieldErrors: FieldErrors<WorkField> = {
        ...(titleError ? { titlePln: titleError } : {}),
        ...(yearError ? { yearOfExecution: yearError } : {}),
        ...(categoryError ? { categoryId: categoryError } : {}),
    }

    const formError = "error" in parsedTags ? parsedTags.error : undefined
    if (Object.keys(fieldErrors).length > 0 || formError) {
        return { fieldErrors, formError }
    }

    const titlePln = rawTitlePln.trim() || null
    const titleEng = rawTitleEng.trim() || null
    const dimensions = rawDimensions.trim() || null

    return {
        values: {
            categoryId,
            titlePln,
            titleEng,
            dimensions,
            yearOfExecution: parseYearOfExecution(rawYear),
            descriptionPln: buildWorkDescription(rawTechniquePln, rawDescriptionPln),
            descriptionEng: buildWorkDescription(rawTechniqueEng, rawDescriptionEng),
        },
        tagIds: "tagIds" in parsedTags ? parsedTags.tagIds : [],
    }
}

type PreparedMediaOrder =
    | { kind: "existing"; mediaId: string; orderIndex: number }
    | {
          kind: "new"
          content: Buffer
          contentHash: string
          fileType: "png" | "jpg" | "gif" | "mp4"
          orderIndex: number
      }

async function readMediaOrder(
    formData: FormData,
    allowExisting: boolean
): Promise<{ items: PreparedMediaOrder[]; hasOrderField: boolean } | { error: string }> {
    const rawOrder = readTextList(formData, "mediaOrder")
    const uploadedFiles = formData
        .getAll("newMedia")
        .filter((entry): entry is File => typeof File !== "undefined" && entry instanceof File)

    if (rawOrder.length === 0 && uploadedFiles.length === 0) {
        return { items: [], hasOrderField: formData.has("mediaOrderSubmitted") }
    }

    const orderTokens =
        rawOrder.length > 0 ? rawOrder : uploadedFiles.map((_, index) => `new:${index}`)

    const items: PreparedMediaOrder[] = []
    const seenExisting = new Set<string>()
    const seenNew = new Set<number>()

    for (let orderIndex = 0; orderIndex < orderTokens.length; orderIndex += 1) {
        const token = orderTokens[orderIndex]
        if (token.startsWith("existing:")) {
            const mediaId = token.slice("existing:".length)
            if (!allowExisting || !isUuid(mediaId) || seenExisting.has(mediaId)) {
                return { error: "Nieprawidłowy identyfikator pliku." }
            }
            seenExisting.add(mediaId)
            items.push({ kind: "existing", mediaId, orderIndex })
            continue
        }

        if (token.startsWith("new:")) {
            const fileIndex = Number(token.slice("new:".length))
            const file = Number.isInteger(fileIndex) ? uploadedFiles[fileIndex] : undefined
            if (!file || seenNew.has(fileIndex)) {
                return { error: "Brakuje przesyłanego pliku." }
            }
            seenNew.add(fileIndex)

            if (file.size === 0) {
                return { error: "Przesyłany plik jest pusty." }
            }
            if (file.size > MAX_MEDIA_FILE_BYTES) {
                return { error: "Każdy plik może mieć maksymalnie 10 MB." }
            }

            const fileType = resolveUploadedFileType(file.type, file.name)
            if (!fileType) {
                return { error: "Obsługiwane formaty plików to PNG, JPG, GIF oraz MP4." }
            }

            const content = Buffer.from(await file.arrayBuffer())
            const contentHash = createHash("sha256").update(content).digest("hex")
            items.push({ kind: "new", content, contentHash, fileType, orderIndex })
            continue
        }

        return { error: "Nieprawidłowa kolejność plików." }
    }

    return { items, hasOrderField: true }
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

    const mediaResult = await readMediaOrder(formData, false)
    if ("error" in mediaResult) return failed({}, mediaResult.error)

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

            const newMediaRows = mediaResult.items
                .filter(
                    (item): item is Extract<PreparedMediaOrder, { kind: "new" }> =>
                        item.kind === "new"
                )
                .map((item) => ({
                    artPieceId: created.artPieceId,
                    content: item.content,
                    contentHash: item.contentHash,
                    fileType: item.fileType,
                    orderIndex: item.orderIndex,
                }))

            if (newMediaRows.length > 0) {
                await tx.insert(media).values(newMediaRows)
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

    const mediaResult = await readMediaOrder(formData, true)
    if ("error" in mediaResult) return failed({}, mediaResult.error)

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

            if (mediaResult.hasOrderField) {
                const existingItems = mediaResult.items.filter(
                    (item): item is Extract<PreparedMediaOrder, { kind: "existing" }> =>
                        item.kind === "existing"
                )
                const retainedIds = existingItems.map((item) => item.mediaId)

                if (retainedIds.length === 0) {
                    await tx.delete(media).where(eq(media.artPieceId, artPieceId))
                } else {
                    await tx
                        .delete(media)
                        .where(
                            and(
                                eq(media.artPieceId, artPieceId),
                                notInArray(media.mediaId, retainedIds)
                            )
                        )
                }

                for (const item of existingItems) {
                    await tx
                        .update(media)
                        .set({ orderIndex: item.orderIndex })
                        .where(
                            and(eq(media.artPieceId, artPieceId), eq(media.mediaId, item.mediaId))
                        )
                }

                const newMediaRows = mediaResult.items
                    .filter(
                        (item): item is Extract<PreparedMediaOrder, { kind: "new" }> =>
                            item.kind === "new"
                    )
                    .map((item) => ({
                        artPieceId,
                        content: item.content,
                        contentHash: item.contentHash,
                        fileType: item.fileType,
                        orderIndex: item.orderIndex,
                    }))

                if (newMediaRows.length > 0) {
                    await tx.insert(media).values(newMediaRows)
                }
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
