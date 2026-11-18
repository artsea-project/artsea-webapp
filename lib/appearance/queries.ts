import { asc, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { artPieces, media } from "@/db/schema"
import type { ThemeDraft } from "@/lib/appearance/theme-editor-state"
import type { ArtworkCatalog } from "@/lib/appearance/validation"
import { DESKTOP_GRID, MOBILE_GRID } from "@/lib/bento-grid"
import { normalizeBentoLayout } from "@/lib/bento-layout"
import { isBentoMediaType } from "@/lib/media"
import { isHexColor } from "@/lib/theme/colors"
import { isSelectableFontName } from "@/lib/theme/fonts"
import { isRecord } from "@/lib/theme/record"
import { defaultSiteTheme } from "@/lib/theme/theme"
import type { BentoBoxLayout, BentoLayoutItem } from "@/types/bento"

export type ArtworkMeta = { title: string | null; isVisible: boolean }

export type PickerArtwork = { artPieceId: string; title: string | null; mediaIds: string[] }

export type AppearanceData = {
    layout: BentoBoxLayout
    artworkMeta: Record<string, ArtworkMeta>
    artworks: PickerArtwork[]
    theme: ThemeDraft
}

type ArtworkRecord = {
    artPieceId: string
    title: string | null
    isVisible: boolean
    mediaIds: string[]
}

type MediaRow = { mediaId: string; artPieceId: string; fileType: string }

function groupTileImagesByWork(rows: MediaRow[]): Map<string, string[]> {
    const imagesByWork = new Map<string, string[]>()
    for (const row of rows) {
        if (!isBentoMediaType(row.fileType)) continue
        const images = imagesByWork.get(row.artPieceId)
        if (images) images.push(row.mediaId)
        else imagesByWork.set(row.artPieceId, [row.mediaId])
    }
    return imagesByWork
}

async function loadArtworkRecords(): Promise<ArtworkRecord[]> {
    const [artworkRows, mediaRows] = await Promise.all([
        db
            .select({
                artPieceId: artPieces.artPieceId,
                title: artPieces.titlePln,
                isVisible: artPieces.isVisible,
            })
            .from(artPieces),
        db
            .select({
                mediaId: media.mediaId,
                artPieceId: media.artPieceId,
                fileType: media.fileType,
            })
            .from(media)
            .orderBy(asc(media.orderIndex)),
    ])
    const imagesByWork = groupTileImagesByWork(mediaRows)

    return artworkRows.map((artwork) => ({
        ...artwork,
        title: artwork.title?.trim() || null,
        mediaIds: imagesByWork.get(artwork.artPieceId) ?? [],
    }))
}

function toCatalog(records: ArtworkRecord[]): ArtworkCatalog {
    return {
        visibleArtPieceIds: new Set(
            records.filter((record) => record.isVisible).map((record) => record.artPieceId)
        ),
        mediaArtPiece: new Map(
            records.flatMap((record) =>
                record.mediaIds.map((mediaId) => [mediaId, record.artPieceId] as const)
            )
        ),
    }
}

export async function getArtworkCatalog(mediaIds: string[]): Promise<ArtworkCatalog> {
    if (mediaIds.length === 0) return { visibleArtPieceIds: new Set(), mediaArtPiece: new Map() }

    const rows = await db
        .select({
            mediaId: media.mediaId,
            artPieceId: media.artPieceId,
            fileType: media.fileType,
            isVisible: artPieces.isVisible,
        })
        .from(media)
        .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
        .where(inArray(media.mediaId, mediaIds))
    const tileImages = rows.filter((row) => isBentoMediaType(row.fileType))

    return {
        visibleArtPieceIds: new Set(
            tileImages.filter((row) => row.isVisible).map((row) => row.artPieceId)
        ),
        mediaArtPiece: new Map(tileImages.map((row) => [row.mediaId, row.artPieceId])),
    }
}

export async function getSavedSiteSettings() {
    return db.query.siteSettings.findFirst({
        columns: { theme: true, layoutBentoBox: true },
    })
}

function usableLayout(layout: unknown, catalog: ArtworkCatalog): BentoBoxLayout {
    const views = isRecord(layout) ? layout : {}
    const isUsable = (item: BentoLayoutItem) =>
        catalog.mediaArtPiece.get(item.mediaId) === item.artPieceId
    const desktop = normalizeBentoLayout(views.desktop, DESKTOP_GRID).filter(isUsable)
    const mobile = normalizeBentoLayout(views.mobile, MOBILE_GRID).filter(isUsable)

    const mobileIds = new Set(mobile.map((item) => item.tileId))
    const shared = new Set(
        desktop.filter((item) => mobileIds.has(item.tileId)).map((item) => item.tileId)
    )
    const isShared = (item: BentoLayoutItem) => shared.has(item.tileId)

    return {
        desktop: { items: desktop.filter(isShared) },
        mobile: { items: mobile.filter(isShared) },
    }
}

function pickValidValues<Values extends Record<string, string>>(
    source: unknown,
    fallback: Values,
    isValid: (value: unknown) => boolean
): Values {
    const values = isRecord(source) ? source : {}
    return Object.fromEntries(
        Object.entries(fallback).map(([key, defaultValue]) => [
            key,
            isValid(values[key]) ? values[key] : defaultValue,
        ])
    ) as Values
}

function resolveThemeDraft(theme: unknown): ThemeDraft {
    const saved = isRecord(theme) ? theme : {}
    return {
        fonts: pickValidValues(saved.fonts, defaultSiteTheme.fonts, isSelectableFontName),
        colors: pickValidValues(saved.colors, defaultSiteTheme.colors, isHexColor),
    }
}

function sortByTitle(left: PickerArtwork, right: PickerArtwork): number {
    if (left.title === right.title) return 0
    if (left.title === null) return 1
    if (right.title === null) return -1
    return left.title.localeCompare(right.title, "pl")
}

export async function getAppearanceData(): Promise<AppearanceData> {
    const [records, settings] = await Promise.all([loadArtworkRecords(), getSavedSiteSettings()])

    const artworkMeta = Object.fromEntries(
        records.map(({ artPieceId, title, isVisible }) => [artPieceId, { title, isVisible }])
    )
    const artworks = records
        .filter((record) => record.isVisible && record.mediaIds.length > 0)
        .map(({ artPieceId, title, mediaIds }) => ({ artPieceId, title, mediaIds }))
        .sort(sortByTitle)

    return {
        layout: usableLayout(settings?.layoutBentoBox, toCatalog(records)),
        artworkMeta,
        artworks,
        theme: resolveThemeDraft(settings?.theme),
    }
}
