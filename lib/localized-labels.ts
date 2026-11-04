import type { Locale } from "@/i18n/routing"

export function resolveLocalizedLabel(
    polish: string | null,
    english: string | null,
    fallback: string
) {
    return polish || english || fallback
}

export function orderLabels(labels: string[], locale: Locale) {
    return [...labels].sort((left, right) => left.localeCompare(right, locale))
}
