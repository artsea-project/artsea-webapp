export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024

export type ProfileImageType = "png" | "jpg"

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]
const JPG_SIGNATURE = [0xff, 0xd8, 0xff]
const ACCEPTED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg"]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i

function startsWithBytes(bytes: Uint8Array, signature: number[]) {
    return signature.every((byte, index) => bytes[index] === byte)
}

export function detectProfileImageType(bytes: Uint8Array): ProfileImageType | null {
    if (startsWithBytes(bytes, PNG_SIGNATURE)) return "png"
    if (startsWithBytes(bytes, JPG_SIGNATURE)) return "jpg"
    return null
}

export function checkProfileImageFile(file: { size: number; type: string }): string | null {
    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)) return "Wybierz plik JPG albo PNG."
    if (file.size > MAX_PROFILE_IMAGE_BYTES) return "Plik jest większy niż 2 MB."
    return null
}

export function splitParagraphs(text: string): string[] {
    return text
        .replace(/\r\n?/g, "\n")
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
}

export function joinParagraphs(paragraphs: string[]): string {
    return paragraphs.join("\n\n")
}

export function checkFullName(value: string): string | null {
    return value.trim() ? null : "Podaj imię lub pseudonim artystyczny."
}

export function checkBilingualText(pln: string, eng: string): string | null {
    if (pln.trim() && !eng.trim()) return "Uzupełnij też wersję angielską."
    if (eng.trim() && !pln.trim()) return "Uzupełnij też wersję polską."
    return null
}

export function normalizeContactEmail(value: string): { email: string | null } | { error: string } {
    const email = value.trim()
    if (!email) return { email: null }
    return EMAIL_PATTERN.test(email) ? { email } : { error: "Podaj poprawny adres e-mail." }
}

export function checkLinkName(value: string): string | null {
    return value.trim() ? null : "Podaj wyświetlany tekst."
}

export function normalizeLinkUrl(value: string): { url: string } | { error: string } {
    const trimmed = value.trim()
    if (!trimmed) return { error: "Podaj link." }

    const withScheme = URL_SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
    const invalid = { error: "Podaj adres strony internetowej, np. instagram.com/twoj-profil." }

    try {
        const { protocol } = new URL(withScheme)
        return protocol === "http:" || protocol === "https:" ? { url: withScheme } : invalid
    } catch {
        return invalid
    }
}

export function displayLinkUrl(url: string): string {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}
