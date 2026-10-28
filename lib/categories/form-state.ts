export type FormStatus = "idle" | "success" | "error"

export type CategoryField = "namePln" | "nameEng"

export type CategoryFormState = {
    status: FormStatus
    fieldErrors: Partial<Record<CategoryField, string>>
    formError?: string
    savedAt?: number
}

export const initialCategoryFormState: CategoryFormState = {
    status: "idle",
    fieldErrors: {},
}

export type TagField = "namePln" | "nameEng"

export type TagFormState = {
    status: FormStatus
    fieldErrors: Partial<Record<TagField, string>>
    savedAt?: number
}

export const initialTagFormState: TagFormState = {
    status: "idle",
    fieldErrors: {},
}
