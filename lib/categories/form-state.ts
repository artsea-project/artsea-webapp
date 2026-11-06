export type FormStatus = "idle" | "success" | "error"

export type BilingualNameField = "namePln" | "nameEng"

export type BilingualNameFormState = {
    status: FormStatus
    fieldErrors: Partial<Record<BilingualNameField, string>>
    formError?: string
    savedAt?: number
    categoryId?: string
    tagId?: string
    createdId?: string
}

export const initialBilingualNameFormState: BilingualNameFormState = {
    status: "idle",
    fieldErrors: {},
}

export type CategoryField = BilingualNameField
export type CategoryFormState = BilingualNameFormState
export const initialCategoryFormState: CategoryFormState = initialBilingualNameFormState

export type TagField = BilingualNameField
export type TagFormState = BilingualNameFormState
export const initialTagFormState: TagFormState = initialBilingualNameFormState
