"use client"

import { useActionState, useEffect, useRef, useState } from "react"

import { updateProfile } from "@/app/admin/profile/actions"
import BilingualTextField, {
    type BilingualFieldCopy,
    type BilingualTexts,
    type Language,
} from "@/components/admin-profile/BilingualTextField"
import { useLeaveGuard } from "@/components/admin-profile/LeaveGuard"
import {
    bioBodyFieldCopy,
    bioHeadingFieldCopy,
    bioHighlightFieldCopy,
    bioIntroFieldCopy,
    contactFieldCopy,
} from "@/components/admin-profile/profile-text-fields"
import ProfilePhotoField from "@/components/admin-profile/ProfilePhotoField"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    initialProfileFormState,
    type BilingualField,
    type ProfileField,
    type ProfileFormState,
} from "@/lib/profile/form-state"
import { profileImagePath } from "@/lib/profile/image"
import type { EditableProfile } from "@/lib/profile/queries"
import { joinParagraphs, splitParagraphs } from "@/lib/profile/validation"

type Draft = {
    fullName: string
    contactEmail: string
} & Record<BilingualField, BilingualTexts>

type TextField = { key: BilingualField; copy: BilingualFieldCopy }

const BIO_FIELDS = [
    { key: "bioHeading", copy: bioHeadingFieldCopy },
    { key: "bioIntro", copy: bioIntroFieldCopy },
    { key: "bioHighlight", copy: bioHighlightFieldCopy },
    { key: "bioBody", copy: bioBodyFieldCopy },
] as const satisfies TextField[]

const CONTACT_FIELD = { key: "contact", copy: contactFieldCopy } as const satisfies TextField

const TEXT_FIELDS = [...BIO_FIELDS, CONTACT_FIELD]

type PickedPhoto = { file: File; previewUrl: string }

function textsFrom(pln: string[] = [], eng: string[] = []): BilingualTexts {
    return { pln: joinParagraphs(pln), eng: joinParagraphs(eng) }
}

function draftFromSaved(saved: EditableProfile | null): Draft {
    return {
        fullName: saved?.fullName ?? "",
        contactEmail: saved?.contactEmail ?? "",
        bioHeading: {
            pln: saved?.bioPln.heading ?? "",
            eng: saved?.bioEng.heading ?? "",
        },
        bioIntro: textsFrom(saved?.bioPln.intro, saved?.bioEng.intro),
        bioHighlight: textsFrom(saved?.bioPln.highlight, saved?.bioEng.highlight),
        bioBody: textsFrom(saved?.bioPln.body, saved?.bioEng.body),
        contact: textsFrom(saved?.contactPln, saved?.contactEng),
    }
}

function normalizeText(text: string) {
    return joinParagraphs(splitParagraphs(text))
}

function textsDiffer(draft: BilingualTexts, saved: BilingualTexts) {
    const languages: Language[] = ["pln", "eng"]
    return languages.some(
        (language) => normalizeText(draft[language]) !== normalizeText(saved[language])
    )
}

function revealFirstError(form: HTMLFormElement | null) {
    const error = form?.querySelector('[data-slot="field-error"]')
    if (!error) return

    const field = error.closest('[data-slot="field"]') ?? error
    field.scrollIntoView({ behavior: "smooth", block: "center" })
    field
        .querySelector<HTMLElement>("input:not([type=hidden]), textarea")
        ?.focus({ preventScroll: true })
}

function differsFromSaved(draft: Draft, saved: Draft) {
    return (
        draft.fullName.trim() !== saved.fullName ||
        draft.contactEmail.trim() !== saved.contactEmail ||
        TEXT_FIELDS.some(({ key }) => textsDiffer(draft[key], saved[key]))
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
    const formRef = useRef<HTMLFormElement>(null)

    function replacePhoto(next: PickedPhoto | null) {
        setPhoto((current) => {
            if (current) URL.revokeObjectURL(current.previewUrl)
            return next
        })
    }

    const [state, formAction, isSaving] = useActionState(
        async (previous: ProfileFormState, formData: FormData) => {
            if (photo) formData.set("profileImage", photo.file)
            const result = await updateProfile(previous, formData)
            if (result.status === "success") replacePhoto(null)
            return result
        },
        initialProfileFormState
    )

    useEffect(() => {
        if (state.status === "error") revealFirstError(formRef.current)
    }, [state])

    const [errorsState, setErrorsState] = useState(state)
    const [editedFields, setEditedFields] = useState<ReadonlySet<ProfileField>>(new Set())
    if (state !== errorsState) {
        setErrorsState(state)
        setEditedFields(new Set())
    }

    function fieldError(field: ProfileField) {
        return editedFields.has(field) ? undefined : state.fieldErrors[field]
    }

    function markEdited(field: ProfileField) {
        if (!editedFields.has(field)) setEditedFields(new Set(editedFields).add(field))
    }

    const isDirty = photo !== null || differsFromSaved(draft, savedDraft)
    const leaveDialog = useLeaveGuard(isDirty)
    const savedPhotoSrc = saved?.imageHash ? profileImagePath(saved.imageHash) : null

    function renderTextField({ key, copy }: TextField) {
        return (
            <BilingualTextField
                key={key}
                copy={copy}
                texts={draft[key]}
                error={fieldError(key)}
                onChange={(language, text) => {
                    setDraft({ ...draft, [key]: { ...draft[key], [language]: text } })
                    markEdited(key)
                }}
            />
        )
    }

    function cancelChanges() {
        setDraft(savedDraft)
        setEditedFields(new Set(Object.keys(state.fieldErrors) as ProfileField[]))
        replacePhoto(null)
        if (photoInputRef.current) photoInputRef.current.value = ""
    }

    return (
        <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-6">
            <ProfilePhotoField
                previewSrc={photo?.previewUrl ?? savedPhotoSrc}
                alt={draft.fullName}
                inputRef={photoInputRef}
                serverError={fieldError("profileImage")}
                onPick={(file) => {
                    replacePhoto({ file, previewUrl: URL.createObjectURL(file) })
                    markEdited("profileImage")
                }}
            />

            <FieldGroup>
                <Field data-invalid={Boolean(fieldError("fullName"))}>
                    <FieldLabel htmlFor="fullName">Imię lub pseudonim artystyczny</FieldLabel>
                    <Input
                        id="fullName"
                        name="fullName"
                        value={draft.fullName}
                        aria-invalid={Boolean(fieldError("fullName"))}
                        onChange={(event) => {
                            setDraft({ ...draft, fullName: event.target.value })
                            markEdited("fullName")
                        }}
                    />
                    <FieldError>{fieldError("fullName")}</FieldError>
                </Field>

                <Field data-invalid={Boolean(fieldError("contactEmail"))}>
                    <FieldLabel htmlFor="contactEmail">Adres e-mail</FieldLabel>
                    <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={draft.contactEmail}
                        aria-invalid={Boolean(fieldError("contactEmail"))}
                        onChange={(event) => {
                            setDraft({ ...draft, contactEmail: event.target.value })
                            markEdited("contactEmail")
                        }}
                    />
                    <FieldError>{fieldError("contactEmail")}</FieldError>
                </Field>

                <FieldSet>
                    <FieldLegend>O mnie / About me</FieldLegend>
                    <FieldDescription>
                        Każde pole to osobna sekcja strony O mnie. Wewnątrz pola akapity oddziel
                        pustą linią.
                    </FieldDescription>
                    {BIO_FIELDS.map(renderTextField)}
                </FieldSet>

                {renderTextField(CONTACT_FIELD)}
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

            {leaveDialog}
        </form>
    )
}
