import { asc } from "drizzle-orm"

import { db } from "@/db"
import { links } from "@/db/schema"
import { parseBio, parseParagraphs } from "@/lib/profile/content"
import type { BioContent } from "@/types/profile"

export type ProfileLink = {
    linkId: string
    name: string
    url: string
}

export type EditableProfile = {
    fullName: string
    contactEmail: string | null
    bioPln: BioContent
    bioEng: BioContent
    contactPln: string[]
    contactEng: string[]
    imageHash: string | null
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
        bioPln: parseBio(profile.bioPln),
        bioEng: parseBio(profile.bioEng),
        contactPln: parseParagraphs(profile.contactPln),
        contactEng: parseParagraphs(profile.contactEng),
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
