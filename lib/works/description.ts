export interface WorkDescription {
    technique: string
    description: string
}

export const EMPTY_WORK_DESCRIPTION: WorkDescription = { technique: "", description: "" }

export function readWorkDescription(value: unknown): WorkDescription {
    if (!value || typeof value !== "object") return EMPTY_WORK_DESCRIPTION

    const { technique, description } = value as Record<string, unknown>
    return {
        technique: typeof technique === "string" ? technique : "",
        description: typeof description === "string" ? description : "",
    }
}

export function buildWorkDescription(
    technique: string,
    description: string
): WorkDescription | null {
    const trimmedTechnique = technique.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTechnique && !trimmedDescription) return null

    return { technique: trimmedTechnique, description: trimmedDescription }
}
