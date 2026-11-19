import { count } from "drizzle-orm"
import { cache } from "react"

import { db } from "@/db"
import { artPieces, categories, tags } from "@/db/schema"
import { getBentoData, type BentoCardData } from "@/lib/bento"
import { getOrderedLinks, type ProfileLink } from "@/lib/profile/queries"

export type AdminOverviewStats = {
    worksCount: number
    categoriesCount: number
    tagsCount: number
    links: ProfileLink[]
}

export type AdminOverviewData = AdminOverviewStats & {
    featuredWorks: BentoCardData[]
}

/** Fetches counts and ordered social links for the admin overview dashboard. */
export const getAdminOverviewStats = cache(async (): Promise<AdminOverviewStats> => {
    const [[worksRow], [categoriesRow], [tagsRow], links] = await Promise.all([
        db.select({ value: count() }).from(artPieces),
        db.select({ value: count() }).from(categories),
        db.select({ value: count() }).from(tags),
        getOrderedLinks(),
    ])

    return {
        worksCount: Number(worksRow?.value ?? 0),
        categoriesCount: Number(categoriesRow?.value ?? 0),
        tagsCount: Number(tagsRow?.value ?? 0),
        links,
    }
})

/** Fetches all data needed to render the admin overview dashboard. */
export const getAdminOverviewData = cache(async (): Promise<AdminOverviewData> => {
    const [stats, bento] = await Promise.all([getAdminOverviewStats(), getBentoData()])

    return {
        ...stats,
        featuredWorks: bento.desktop,
    }
})
