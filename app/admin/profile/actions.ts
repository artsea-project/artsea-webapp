"use server"

import { createHash } from "node:crypto"

import { eq } from "drizzle-orm"
import { refresh } from "next/cache"

import { db } from "@/db"
import { links, profiles } from "@/db/schema"
import type {
    LinkField,
    LinkFormState,
    ProfileField,
    ProfileFormState,
} from "@/lib/profile/form-state"
import {
    checkFullName,
    checkLinkName,
    checkProfileImageFile,
    detectProfileImageType,
    normalizeContactEmail,
    normalizeLinkUrl,
    splitParagraphs,
} from "@/lib/profile/validation"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type FieldErrors<Field extends string> = Partial<Record<Field, string>>

function readText(formData: FormData, name: string): string {
    const value = formData.get(name)
    return typeof value === "string" ? value : ""
}

function failed<Field extends string>(fieldErrors: FieldErrors<Field>) {
    return { status: "error" as const, fieldErrors }
}

function succeeded() {
    return { status: "success" as const, fieldErrors: {}, savedAt: Date.now() }
}

async function readProfileImage(formData: FormData) {
    const file = formData.get("profileImage")
    if (!(file instanceof File) || file.size === 0) return { columns: {} }

    const fileError = checkProfileImageFile(file)
    if (fileError) return { error: fileError }

    const content = Buffer.from(await file.arrayBuffer())
    const fileType = detectProfileImageType(content)
    if (!fileType) return { error: "Wybierz plik JPG albo PNG." }

    return {
        columns: {
            profileImageContent: content,
            profileImageContentHash: createHash("sha256").update(content).digest("hex"),
            profileImageFileType: fileType,
        },
    }
}

export async function updateProfile(
    _previous: ProfileFormState,
    formData: FormData
): Promise<ProfileFormState> {
    const fullName = readText(formData, "fullName")
    const email = normalizeContactEmail(readText(formData, "contactEmail"))
    const image = await readProfileImage(formData)

    const fullNameError = checkFullName(fullName)
    if (fullNameError || "error" in email || "error" in image) {
        return failed<ProfileField>({
            fullName: fullNameError ?? undefined,
            contactEmail: "error" in email ? email.error : undefined,
            profileImage: "error" in image ? image.error : undefined,
        })
    }

    const values = {
        fullName: fullName.trim(),
        contactEmail: email.email,
        bioPln: { paragraphs: splitParagraphs(readText(formData, "bioPln")) },
        bioEng: { paragraphs: splitParagraphs(readText(formData, "bioEng")) },
        contactPln: { paragraphs: splitParagraphs(readText(formData, "contactPln")) },
        contactEng: { paragraphs: splitParagraphs(readText(formData, "contactEng")) },
        ...image.columns,
    }

    await db
        .insert(profiles)
        .values(values)
        .onConflictDoUpdate({ target: profiles.isSingleton, set: values })

    refresh()
    return succeeded()
}

function readLink(formData: FormData) {
    const name = readText(formData, "name")
    const url = normalizeLinkUrl(readText(formData, "url"))

    const nameError = checkLinkName(name)
    if (nameError || "error" in url) {
        const fieldErrors: FieldErrors<LinkField> = {
            name: nameError ?? undefined,
            url: "error" in url ? url.error : undefined,
        }
        return { fieldErrors }
    }

    return { values: { name: name.trim(), url: url.url } }
}

export async function createLink(
    _previous: LinkFormState,
    formData: FormData
): Promise<LinkFormState> {
    const link = readLink(formData)
    if (!link.values) return failed(link.fieldErrors)

    await db.insert(links).values(link.values)

    refresh()
    return succeeded()
}

export async function updateLink(
    _previous: LinkFormState,
    formData: FormData
): Promise<LinkFormState> {
    const linkId = readText(formData, "linkId")
    if (!UUID_PATTERN.test(linkId)) return failed({})

    const link = readLink(formData)
    if (!link.values) return failed(link.fieldErrors)

    const updated = await db
        .update(links)
        .set(link.values)
        .where(eq(links.linkId, linkId))
        .returning({ linkId: links.linkId })

    refresh()
    if (updated.length === 0) return failed<LinkField>({ name: "Ten link został już usunięty." })
    return succeeded()
}

export async function deleteLink(linkId: string): Promise<void> {
    if (!UUID_PATTERN.test(linkId)) return

    await db.delete(links).where(eq(links.linkId, linkId))
    refresh()
}
