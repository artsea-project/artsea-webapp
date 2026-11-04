import { count, countDistinct } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, tags } from "@/db/schema"

export type OverviewStats = {
    works: number
    /** Categories that at least one work belongs to. */
    activeCategories: number
    tags: number
}

export async function getOverviewStats(): Promise<OverviewStats> {
    const [[works], [tagCount]] = await Promise.all([
        db
            .select({ total: count(), activeCategories: countDistinct(artPieces.categoryId) })
            .from(artPieces),
        db.select({ total: count() }).from(tags),
    ])

    return {
        works: works.total,
        activeCategories: works.activeCategories,
        tags: tagCount.total,
    }
}
