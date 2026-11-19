import { db } from "@/db"
import { artPieces } from "@/db/schema"

export type OverviewCounts = {
    works: number
}

export async function getOverviewCounts(): Promise<OverviewCounts> {
    return { works: await db.$count(artPieces) }
}
