export function checkCategoryNamePln(value: string): string | null {
    return value.trim() ? null : "Podaj nazwę kategorii po polsku."
}

export function checkCategoryNameEng(value: string): string | null {
    return value.trim() ? null : "Podaj nazwę kategorii po angielsku."
}

export function normalizeTagName(value: string): string {
    return value.trim().replace(/^#+/, "").trim()
}

export function checkTagNamePln(value: string): string | null {
    return normalizeTagName(value) ? null : "Podaj nazwę tagu po polsku."
}

export function checkTagNameEng(value: string): string | null {
    return normalizeTagName(value) ? null : "Podaj nazwę tagu po angielsku."
}

export function checkTagNames(rawPln: string, rawEng: string): string | null {
    const pln = normalizeTagName(rawPln)
    const eng = normalizeTagName(rawEng)
    return pln || eng ? null : "Podaj nazwę tagu w przynajmniej jednym języku."
}

export function formatWorksCount(count: number): string {
    if (count === 1) return "1 praca"
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return `${count} prace`
    }
    return `${count} prac`
}
