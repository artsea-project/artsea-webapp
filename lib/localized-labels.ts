export function resolveLocalizedLabel(
    polish: string | null,
    english: string | null,
    fallback: string
) {
    return polish || english || fallback
}
