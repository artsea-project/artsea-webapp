"use client"

import { useActionState, useRef, useState } from "react"

import { updateProfile } from "@/app/admin/profile/actions"
import BioField, { type BioLanguage } from "@/components/admin-profile/BioField"
import ProfilePhotoField from "@/components/admin-profile/ProfilePhotoField"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { initialProfileFormState, type ProfileFormState } from "@/lib/profile/form-state"
import { profileImagePath } from "@/lib/profile/image"
import type { EditableProfile } from "@/lib/profile/queries"
import { joinParagraphs, splitParagraphs } from "@/lib/profile/validation"

type Draft = {
    fullName: string
    contactEmail: string
    bio: Record<BioLanguage, string>
}

type PickedPhoto = { file: File; previewUrl: string }

function draftFromSaved(saved: EditableProfile | null): Draft {
    return {
        fullName: saved?.fullName ?? "",
        contactEmail: saved?.contactEmail ?? "",
        bio: { pln: joinParagraphs(saved?.bioPln ?? []), eng: joinParagraphs(saved?.bioEng ?? []) },
    }
}

function differsFromSaved(draft: Draft, saved: Draft) {
    const normalizeBio = (text: string) => joinParagraphs(splitParagraphs(text))

    return (
        draft.fullName.trim() !== saved.fullName ||
        draft.contactEmail.trim() !== saved.contactEmail ||
        normalizeBio(draft.bio.pln) !== saved.bio.pln ||
        normalizeBio(draft.bio.eng) !== saved.bio.eng
    )
}

interface ProfileFormProps {
    saved: EditableProfile | null
}

export default function ProfileForm({ saved }: ProfileFormProps) {
    const savedDraft = draftFromSaved(saved)
    const [draft, setDraft] = useState(savedDraft)
    const [photo, setPhoto] = useState<PickedPhoto | null>(null)
    const photoInputRef = useRef<HTMLInputElement>(null)

    function replacePhoto(next: PickedPhoto | null) {
        setPhoto((current) => {
            if (current) URL.revokeObjectURL(current.previewUrl)
            return next
        })
    }

    const [state, formAction, isSaving] = useActionState(
        async (previous: ProfileFormState, formData: FormData) => {
            const result = await updateProfile(previous, formData)
            if (result.status === "success") replacePhoto(null)
            return result
        },
        initialProfileFormState
    )

    const isDirty = photo !== null || differsFromSaved(draft, savedDraft)
    const savedPhotoSrc = saved?.imageHash ? profileImagePath(saved.imageHash) : null

    function cancelChanges() {
        setDraft(savedDraft)
        replacePhoto(null)
        if (photoInputRef.current) photoInputRef.current.value = ""
    }

    return (
        <form action={formAction} noValidate className="flex flex-col gap-6">
            <ProfilePhotoField
                previewSrc={photo?.previewUrl ?? savedPhotoSrc}
                alt={draft.fullName}
                inputRef={photoInputRef}
                serverError={state.fieldErrors.profileImage}
                onPick={(file) => replacePhoto({ file, previewUrl: URL.createObjectURL(file) })}
            />

            <FieldGroup>
                <Field data-invalid={Boolean(state.fieldErrors.fullName)}>
                    <FieldLabel htmlFor="fullName">Imię i nazwisko</FieldLabel>
                    <Input
                        id="fullName"
                        name="fullName"
                        value={draft.fullName}
                        aria-invalid={Boolean(state.fieldErrors.fullName)}
                        onChange={(event) => setDraft({ ...draft, fullName: event.target.value })}
                    />
                    <FieldError>{state.fieldErrors.fullName}</FieldError>
                </Field>

                <Field data-invalid={Boolean(state.fieldErrors.contactEmail)}>
                    <FieldLabel htmlFor="contactEmail">Adres e-mail</FieldLabel>
                    <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={draft.contactEmail}
                        aria-invalid={Boolean(state.fieldErrors.contactEmail)}
                        onChange={(event) =>
                            setDraft({ ...draft, contactEmail: event.target.value })
                        }
                    />
                    <FieldError>{state.fieldErrors.contactEmail}</FieldError>
                </Field>

                <BioField
                    texts={draft.bio}
                    onChange={(language, text) =>
                        setDraft({ ...draft, bio: { ...draft.bio, [language]: text } })
                    }
                />
            </FieldGroup>

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="submit"
                    disabled={isSaving || !isDirty}
                    className="bg-foreground text-background hover:bg-foreground/90"
                >
                    Zapisz zmiany
                </Button>
                <Button type="button" variant="outline" onClick={cancelChanges}>
                    Anuluj
                </Button>
                <p role="status" className="text-sm text-muted-foreground">
                    {state.status === "success" && !isDirty ? "Zapisano zmiany." : ""}
                </p>
            </div>
        </form>
    )
}
