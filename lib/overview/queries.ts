import { eq } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, categories } from "@/db/schema"

export type OverviewCounts = {
    works: number
    hiddenWorks: number
    categories: number
}

export async function getOverviewCounts(): Promise<OverviewCounts> {
    const [works, hiddenWorks, categoryCount] = await Promise.all([
        db.$count(artPieces),
        db.$count(artPieces, eq(artPieces.isVisible, false)),
        db.$count(categories),
    ])

    return { works, hiddenWorks, categories: categoryCount }
}
