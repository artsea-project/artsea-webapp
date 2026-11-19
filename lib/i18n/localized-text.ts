export type LocalizedText = { kind: "text"; text: string } | { kind: "missingTranslation" } | null

export function localizedText(current: string, other: string): LocalizedText {
    if (current.trim()) return { kind: "text", text: current }
    if (other.trim()) return { kind: "missingTranslation" }
    return null
}
