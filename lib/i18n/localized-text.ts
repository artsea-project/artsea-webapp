export type Localized<Value> =
    | { kind: "content"; value: Value }
    | { kind: "missingTranslation" }
    | null

export type LocalizedText = Localized<string>

export function hasText(text: string): boolean {
    return text.trim() !== ""
}

export function localizedContent<Value>(
    current: Value,
    other: Value,
    hasContent: (value: Value) => boolean
): Localized<Value> {
    if (hasContent(current)) return { kind: "content", value: current }
    if (hasContent(other)) return { kind: "missingTranslation" }
    return null
}

export function localizedText(current: string, other: string): LocalizedText {
    return localizedContent(current, other, hasText)
}
