import { asc, count, eq, sql } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, categories, tags } from "@/db/schema"

export interface AdminCategory {
    categoryId: string
    namePln: string
    nameEng: string
    worksCount: number
}

export interface AdminTag {
    tagId: string
    namePln: string
    nameEng: string
}

export async function getCategoriesWithWorkCounts(): Promise<AdminCategory[]> {
    const rows = await db
        .select({
            categoryId: categories.categoryId,
            namePln: categories.namePln,
            nameEng: categories.nameEng,
            worksCount: count(artPieces.artPieceId),
        })
        .from(categories)
        .leftJoin(artPieces, eq(categories.categoryId, artPieces.categoryId))
        .groupBy(categories.categoryId, categories.namePln, categories.nameEng)
        .orderBy(asc(categories.namePln))

    return rows.map((row) => ({
        ...row,
        worksCount: Number(row.worksCount),
    }))
}

export async function getOrderedTags(): Promise<AdminTag[]> {
    return db
        .select({
            tagId: tags.tagId,
            namePln: tags.namePln,
            nameEng: tags.nameEng,
        })
        .from(tags)
        .orderBy(asc(sql`lower(${tags.namePln})`))
}
