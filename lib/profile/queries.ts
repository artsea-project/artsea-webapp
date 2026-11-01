import { asc } from "drizzle-orm"

import { db } from "@/db"
import { links, profiles } from "@/db/schema"
import type { Locale } from "@/i18n/routing"
import { localizedKey } from "@/lib/i18n/localized-key"
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

export type AboutProfile = {
    fullName: string
    contactEmail: string | null
    imageHash: string | null
    bio: BioContent
    contact: string[]
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

export async function getArtistName(): Promise<string | null> {
    const profile = await db.query.profiles.findFirst({ columns: { fullName: true } })
    return profile?.fullName ?? null
}

export async function getAboutProfile(locale: Locale): Promise<AboutProfile | null> {
    const [profile] = await db
        .select({
            fullName: profiles.fullName,
            contactEmail: profiles.contactEmail,
            imageHash: profiles.profileImageContentHash,
            bio: profiles[localizedKey("bio", locale)],
            contact: profiles[localizedKey("contact", locale)],
        })
        .from(profiles)
        .limit(1)

    if (!profile) return null

    return { ...profile, bio: parseBio(profile.bio), contact: parseParagraphs(profile.contact) }
}
