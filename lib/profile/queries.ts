import { asc } from "drizzle-orm"

import { db } from "@/db"
import { links } from "@/db/schema"
import type { BioContent, ContactContent } from "@/types/profile"

export type ProfileLink = {
    linkId: string
    name: string
    url: string
}

export type EditableProfile = {
    fullName: string
    contactEmail: string | null
    bioPln: string[]
    bioEng: string[]
    contactPln: string[]
    contactEng: string[]
    imageHash: string | null
}

function paragraphsOf(content: BioContent | ContactContent | null): string[] {
    return Array.isArray(content?.paragraphs) ? content.paragraphs : []
}

export async function getOrderedLinks(): Promise<ProfileLink[]> {
    return db
        .select({ linkId: links.linkId, name: links.name, url: links.url })
        .from(links)
        .orderBy(asc(links.position))
}

export async function getEditableProfile(): Promise<EditableProfile | null> {
    const profile = await db.query.profiles.findFirst({
        columns: {
            fullName: true,
            contactEmail: true,
            bioPln: true,
            bioEng: true,
            contactPln: true,
            contactEng: true,
            profileImageContentHash: true,
        },
    })

    if (!profile) return null

    return {
        fullName: profile.fullName,
        contactEmail: profile.contactEmail,
        bioPln: paragraphsOf(profile.bioPln),
        bioEng: paragraphsOf(profile.bioEng),
        contactPln: paragraphsOf(profile.contactPln),
        contactEng: paragraphsOf(profile.contactEng),
        imageHash: profile.profileImageContentHash,
    }
}

export async function getSidebarProfile(): Promise<{
    fullName: string
    imageHash: string | null
} | null> {
    const profile = await db.query.profiles.findFirst({
        columns: { fullName: true, profileImageContentHash: true },
    })

    return profile
        ? { fullName: profile.fullName, imageHash: profile.profileImageContentHash }
        : null
}

export async function getContactEmail(): Promise<string | null> {
    const profile = await db.query.profiles.findFirst({ columns: { contactEmail: true } })
    return profile?.contactEmail ?? null
}
