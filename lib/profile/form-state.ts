export type FormStatus = "idle" | "success" | "error"

export type ProfileField = "fullName" | "contactEmail" | "profileImage"

export type ProfileFormState = {
    status: FormStatus
    fieldErrors: Partial<Record<ProfileField, string>>
    savedAt?: number
}

export const initialProfileFormState: ProfileFormState = { status: "idle", fieldErrors: {} }

export type LinkField = "name" | "url"

export type LinkFormState = {
    status: FormStatus
    fieldErrors: Partial<Record<LinkField, string>>
    savedAt?: number
}

export const initialLinkFormState: LinkFormState = { status: "idle", fieldErrors: {} }
