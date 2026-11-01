export const WORKS_PER_PAGE = 6
export const MIN_YEAR_OF_EXECUTION = 1000
export const MAX_MEDIA_FILE_BYTES = 10 * 1024 * 1024

const MIME_TO_FILE_TYPE: Record<string, "png" | "jpg" | "gif" | "mp4"> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "video/mp4": "mp4",
}

const EXTENSION_TO_FILE_TYPE: Record<string, "png" | "jpg" | "gif" | "mp4"> = {
    png: "png",
    jpg: "jpg",
    jpeg: "jpg",
    gif: "gif",
    mp4: "mp4",
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
    return UUID_PATTERN.test(value)
}

export function resolveUploadedFileType(
    mimeType: string,
    fileName: string
): "png" | "jpg" | "gif" | "mp4" | null {
    const normalizedMime = mimeType.trim().toLowerCase()
    if (normalizedMime in MIME_TO_FILE_TYPE) {
        return MIME_TO_FILE_TYPE[normalizedMime]
    }
    const extension = fileName.split(".").pop()?.trim().toLowerCase() ?? ""
    return EXTENSION_TO_FILE_TYPE[extension] ?? null
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function checkWorkTitles(rawPln: string, rawEng: string): string | null {
    return rawPln.trim() || rawEng.trim() ? null : "Podaj tytuł pracy w przynajmniej jednym języku."
}

export function checkYearOfExecution(
    raw: string,
    maxYear: number = new Date().getFullYear() + 1
): string | null {
    const value = raw.trim()
    if (!value) return null

    const year = Number(value)
    if (!/^\d+$/.test(value) || year < MIN_YEAR_OF_EXECUTION || year > maxYear) {
        return `Podaj rok w zakresie ${MIN_YEAR_OF_EXECUTION}-${maxYear}.`
    }
    return null
}

export function parseYearOfExecution(raw: string): number | null {
    const value = raw.trim()
    return value ? Number(value) : null
}

export function checkWorkCategory(categoryId: string): string | null {
    return isUuid(categoryId) ? null : "Wybierz kategorię pracy."
}

export function parseTagIds(rawIds: string[]): { tagIds: string[] } | { error: string } {
    if (rawIds.some((id) => !isUuid(id))) {
        return { error: "Nieprawidłowy identyfikator tagu." }
    }
    return { tagIds: [...new Set(rawIds)] }
}

export function normalizeSearchQuery(raw: string | string[] | undefined): string {
    const value = Array.isArray(raw) ? raw[0] : raw
    return (value ?? "").trim().replace(/\s+/g, " ")
}

export function parsePage(raw: string | string[] | undefined): number {
    const value = Array.isArray(raw) ? raw[0] : raw
    const page = Number(value)
    return Number.isInteger(page) && page >= 1 ? page : 1
}

export function escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, "\\$&")
}
