import { eq } from "drizzle-orm"

import { db } from "@/db"
import { artPieces } from "@/db/schema"

export type OverviewCounts = {
    works: number
    hiddenWorks: number
}

export async function getOverviewCounts(): Promise<OverviewCounts> {
    const [works, hiddenWorks] = await Promise.all([
        db.$count(artPieces),
        db.$count(artPieces, eq(artPieces.isVisible, false)),
    ])

    return { works, hiddenWorks }
}
