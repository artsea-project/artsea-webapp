import type { FormStatus } from "@/lib/categories/form-state"

export type WorkField =
    | "titlePln"
    | "titleEng"
    | "yearOfExecution"
    | "techniquePln"
    | "techniqueEng"
    | "descriptionPln"
    | "descriptionEng"
    | "categoryId"

export type WorkFormState = {
    status: FormStatus
    fieldErrors: Partial<Record<WorkField, string>>
    formError?: string
    savedAt?: number
    workId?: string
}

export const initialWorkFormState: WorkFormState = {
    status: "idle",
    fieldErrors: {},
}
