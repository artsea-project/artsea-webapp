export const WORKS_PER_PAGE = 6
export const MIN_YEAR_OF_EXECUTION = 1000
export const MAX_TITLE_LENGTH = 200
export const MAX_TECHNIQUE_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 10000

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
    return UUID_PATTERN.test(value)
}

export function checkWorkTitles(rawPln: string, rawEng: string): string | null {
    const pln = rawPln.trim()
    const eng = rawEng.trim()

    if (!pln && !eng) return "Podaj tytuł pracy w przynajmniej jednym języku."
    if (pln.length > MAX_TITLE_LENGTH || eng.length > MAX_TITLE_LENGTH) {
        return `Tytuł może mieć maksymalnie ${MAX_TITLE_LENGTH} znaków.`
    }
    return null
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

export function checkTechnique(raw: string): string | null {
    return raw.trim().length > MAX_TECHNIQUE_LENGTH
        ? `Technika może mieć maksymalnie ${MAX_TECHNIQUE_LENGTH} znaków.`
        : null
}

export function checkDescription(raw: string): string | null {
    return raw.trim().length > MAX_DESCRIPTION_LENGTH
        ? `Opis może mieć maksymalnie ${MAX_DESCRIPTION_LENGTH} znaków.`
        : null
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
