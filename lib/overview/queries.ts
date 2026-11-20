import { eq } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, categories, tags } from "@/db/schema"

export type OverviewCounts = {
    works: number
    hiddenWorks: number
    categories: number
    tags: number
}

export async function getOverviewCounts(): Promise<OverviewCounts> {
    const [works, hiddenWorks, categoryCount, tagCount] = await Promise.all([
        db.$count(artPieces),
        db.$count(artPieces, eq(artPieces.isVisible, false)),
        db.$count(categories),
        db.$count(tags),
    ])

    return { works, hiddenWorks, categories: categoryCount, tags: tagCount }
}
