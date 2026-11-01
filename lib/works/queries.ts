import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, artPieceTags, categories, media } from "@/db/schema"
import { getOrderedTags, type AdminTag } from "@/lib/categories/queries"
import { resolveLocalizedLabel } from "@/lib/localized-labels"
import { readWorkDescription, type WorkDescription } from "@/lib/works/description"
import { escapeLikePattern, isUuid, WORKS_PER_PAGE } from "@/lib/works/validation"

export interface AdminWork {
    artPieceId: string
    title: string
    categoryNamePln: string
    uploadedAt: Date
    isVisible: boolean
    coverMediaId: string | null
}

export interface AdminWorksPage {
    works: AdminWork[]
    total: number
    page: number
    pageCount: number
}

export interface WorkMediaItem {
    mediaId: string
    fileType: string
    orderIndex: number
    sizeBytes: number
}

export interface WorkForEdit {
    artPieceId: string
    categoryId: string
    isVisible: boolean
    titlePln: string
    titleEng: string
    yearOfExecution: number | null
    descriptionPln: WorkDescription
    descriptionEng: WorkDescription
    tagIds: string[]
    media: WorkMediaItem[]
}

export interface WorkCategoryOption {
    categoryId: string
    namePln: string
    nameEng: string
}

export interface WorkFormOptions {
    categories: WorkCategoryOption[]
    tags: AdminTag[]
}

const IMAGE_FILE_TYPES = ["png", "jpg", "gif"] as const

function buildSearchFilter(search: string) {
    if (!search) return undefined

    const pattern = `%${escapeLikePattern(search)}%`
    return or(
        ilike(artPieces.titlePln, pattern),
        ilike(artPieces.titleEng, pattern),
        ilike(categories.namePln, pattern),
        ilike(categories.nameEng, pattern)
    )
}

async function getCoverMediaIds(artPieceIds: string[]): Promise<Map<string, string>> {
    if (artPieceIds.length === 0) return new Map()

    const rows = await db
        .select({ mediaId: media.mediaId, artPieceId: media.artPieceId })
        .from(media)
        .where(
            and(
                inArray(media.artPieceId, artPieceIds),
                inArray(media.fileType, [...IMAGE_FILE_TYPES])
            )
        )
        .orderBy(asc(media.orderIndex))

    const covers = new Map<string, string>()
    for (const row of rows) {
        if (!covers.has(row.artPieceId)) covers.set(row.artPieceId, row.mediaId)
    }
    return covers
}

export async function getAdminWorks({
    search,
    page,
}: {
    search: string
    page: number
}): Promise<AdminWorksPage> {
    const filter = buildSearchFilter(search)

    const [{ value: totalValue }] = await db
        .select({ value: count() })
        .from(artPieces)
        .innerJoin(categories, eq(artPieces.categoryId, categories.categoryId))
        .where(filter)

    const total = Number(totalValue)
    const pageCount = Math.max(1, Math.ceil(total / WORKS_PER_PAGE))
    const currentPage = Math.min(Math.max(1, page), pageCount)

    const rows = await db
        .select({
            artPieceId: artPieces.artPieceId,
            titlePln: artPieces.titlePln,
            titleEng: artPieces.titleEng,
            categoryNamePln: categories.namePln,
            uploadedAt: artPieces.uploadedAt,
            isVisible: artPieces.isVisible,
        })
        .from(artPieces)
        .innerJoin(categories, eq(artPieces.categoryId, categories.categoryId))
        .where(filter)
        .orderBy(desc(artPieces.uploadedAt), asc(artPieces.artPieceId))
        .limit(WORKS_PER_PAGE)
        .offset((currentPage - 1) * WORKS_PER_PAGE)

    const covers = await getCoverMediaIds(rows.map((row) => row.artPieceId))

    return {
        works: rows.map(({ titlePln, titleEng, ...row }) => ({
            ...row,
            title: resolveLocalizedLabel(
                titlePln?.trim() || null,
                titleEng?.trim() || null,
                "Bez tytułu"
            ),
            coverMediaId: covers.get(row.artPieceId) ?? null,
        })),
        total,
        page: currentPage,
        pageCount,
    }
}

export async function getWorkForEdit(artPieceId: string): Promise<WorkForEdit | null> {
    if (!isUuid(artPieceId)) return null

    const work = await db.query.artPieces.findFirst({
        where: eq(artPieces.artPieceId, artPieceId),
    })
    if (!work) return null

    const [tagRows, mediaRows] = await Promise.all([
        db
            .select({ tagId: artPieceTags.tagId })
            .from(artPieceTags)
            .where(eq(artPieceTags.artPieceId, artPieceId)),
        db
            .select({
                mediaId: media.mediaId,
                fileType: media.fileType,
                orderIndex: media.orderIndex,
                sizeBytes: sql<number>`octet_length(${media.content})`,
            })
            .from(media)
            .where(eq(media.artPieceId, artPieceId))
            .orderBy(asc(media.orderIndex)),
    ])

    return {
        artPieceId: work.artPieceId,
        categoryId: work.categoryId,
        isVisible: work.isVisible,
        titlePln: work.titlePln ?? "",
        titleEng: work.titleEng ?? "",
        yearOfExecution: work.yearOfExecution,
        descriptionPln: readWorkDescription(work.descriptionPln),
        descriptionEng: readWorkDescription(work.descriptionEng),
        tagIds: tagRows.map((row) => row.tagId),
        media: mediaRows.map((row) => ({ ...row, sizeBytes: Number(row.sizeBytes) })),
    }
}

export async function getWorkFormOptions(): Promise<WorkFormOptions> {
    const [categoryRows, tagRows] = await Promise.all([
        db
            .select({
                categoryId: categories.categoryId,
                namePln: categories.namePln,
                nameEng: categories.nameEng,
            })
            .from(categories)
            .orderBy(asc(categories.namePln)),
        getOrderedTags(),
    ])

    return { categories: categoryRows, tags: tagRows }
}
