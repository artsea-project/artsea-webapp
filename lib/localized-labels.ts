export function resolveLocalizedLabel(
    polish: string | null,
    english: string | null,
    fallback: string
) {
    return polish || english || fallback
}

export function orderBentoLabels(labels: string[]) {
    return [...labels].sort((left, right) => left.localeCompare(right, "pl"))
}
