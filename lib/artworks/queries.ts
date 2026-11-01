import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, artPieceTags, categories, media, tags } from "@/db/schema"
import type { Locale } from "@/i18n/routing"
import { localizedKey } from "@/lib/i18n/localized-key"
import { isBentoMediaType } from "@/lib/media"

export type ArtworkDetails = {
    artPieceId: string
    title: string | null
    categoryName: string
    yearOfExecution: number | null
    dimensions: string | null
    technique: string
    description: string
    tags: string[]
    photos: { mediaId: string; orderIndex: number }[]
}

export type ArtworkLink = {
    artPieceId: string
    title: string | null
}

function parseDescriptionSlot(value: unknown, slot: "technique" | "description"): string {
    if (!value || typeof value !== "object") return ""
    const obj = value as Record<string, unknown>
    return typeof obj[slot] === "string" ? (obj[slot] as string) : ""
}

export async function getArtworkDetails(
    id: string,
    locale: Locale
): Promise<ArtworkDetails | null> {
    const [artwork] = await db
        .select({
            artPieceId: artPieces.artPieceId,
            title: artPieces[localizedKey("title", locale)],
            description: artPieces[localizedKey("description", locale)],
            categoryName: categories[localizedKey("name", locale)],
            yearOfExecution: artPieces.yearOfExecution,
            dimensions: artPieces.dimensions,
        })
        .from(artPieces)
        .innerJoin(categories, eq(artPieces.categoryId, categories.categoryId))
        .where(and(eq(artPieces.artPieceId, id), eq(artPieces.isVisible, true)))
        .limit(1)

    if (!artwork) return null

    const [tagRows, mediaRows] = await Promise.all([
        db
            .select({ name: tags[localizedKey("name", locale)] })
            .from(artPieceTags)
            .innerJoin(tags, eq(artPieceTags.tagId, tags.tagId))
            .where(eq(artPieceTags.artPieceId, id)),
        db
            .select({
                mediaId: media.mediaId,
                orderIndex: media.orderIndex,
                fileType: media.fileType,
            })
            .from(media)
            .where(eq(media.artPieceId, id))
            .orderBy(asc(media.orderIndex)),
    ])

    return {
        artPieceId: artwork.artPieceId,
        title: artwork.title || null,
        categoryName: artwork.categoryName,
        yearOfExecution: artwork.yearOfExecution,
        dimensions: artwork.dimensions,
        technique: parseDescriptionSlot(artwork.description, "technique"),
        description: parseDescriptionSlot(artwork.description, "description"),
        tags: tagRows.flatMap(({ name }) => (name ? [name] : [])),
        photos: mediaRows
            .filter(({ fileType }) => isBentoMediaType(fileType))
            .map(({ mediaId, orderIndex }) => ({ mediaId, orderIndex })),
    }
}

export async function getNextArtwork(id: string, locale: Locale): Promise<ArtworkLink | null> {
    const visible = await db
        .select({
            artPieceId: artPieces.artPieceId,
            title: artPieces[localizedKey("title", locale)],
        })
        .from(artPieces)
        .where(eq(artPieces.isVisible, true))
        .orderBy(asc(artPieces.uploadedAt))

    const currentIndex = visible.findIndex((artwork) => artwork.artPieceId === id)
    if (currentIndex === -1 || visible.length < 2) return null

    const next = visible[(currentIndex + 1) % visible.length]
    return { artPieceId: next.artPieceId, title: next.title || null }
}
