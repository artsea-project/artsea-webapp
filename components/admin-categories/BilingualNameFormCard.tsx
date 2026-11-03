"use client"

import { useActionState, useEffect, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    initialBilingualNameFormState,
    type BilingualNameField,
    type BilingualNameFormState,
} from "@/lib/categories/form-state"

export type BilingualNameAction = (
    previous: BilingualNameFormState,
    formData: FormData
) => Promise<BilingualNameFormState>

export interface BilingualNameItem {
    id: string
    namePln: string
    nameEng: string
}

export interface BilingualNameFormCopy {
    idPrefix: string
    idFieldName: string
    createTitle: string
    editTitle: string
    plnLabel: string
    plnPlaceholder: string
    engLabel: string
    engPlaceholder: string
    createSubmitLabel: string
    editSubmitLabel: string
    createdMessage: string
    updatedMessage: string
    saveErrorMessage: string
}

interface BilingualNameFormCardProps {
    item?: BilingualNameItem
    copy: BilingualNameFormCopy
    createAction: BilingualNameAction
    updateAction: BilingualNameAction
    onDone: (message: string) => void
    onCancel?: () => void
    onSavingChange?: (isSaving: boolean) => void
    footer?: ReactNode
}

export default function BilingualNameFormCard({
    item,
    copy,
    createAction,
    updateAction,
    onDone,
    onCancel,
    onSavingChange,
    footer,
}: BilingualNameFormCardProps) {
    const [namePln, setNamePln] = useState(item?.namePln ?? "")
    const [nameEng, setNameEng] = useState(item?.nameEng ?? "")

    const [state, formAction, isSaving] = useActionState(
        async (
            previous: BilingualNameFormState,
            formData: FormData
        ): Promise<BilingualNameFormState> => {
            let result: BilingualNameFormState
            try {
                result = await (item ? updateAction : createAction)(previous, formData)
            } catch {
                return {
                    status: "error",
                    fieldErrors: {},
                    formError: copy.saveErrorMessage,
                }
            }

            if (result.status === "success") {
                if (!item) {
                    setNamePln("")
                    setNameEng("")
                }
                onDone(item ? copy.updatedMessage : copy.createdMessage)
            }
            return result
        },
        initialBilingualNameFormState
    )

    const [errorsState, setErrorsState] = useState(state)
    const [editedFields, setEditedFields] = useState<ReadonlySet<BilingualNameField>>(new Set())
    if (state !== errorsState) {
        setErrorsState(state)
        setEditedFields(new Set())
    }

    function fieldError(field: BilingualNameField) {
        return editedFields.has(field) ? undefined : state.fieldErrors[field]
    }

    function markEdited(field: BilingualNameField) {
        if (!editedFields.has(field)) {
            setEditedFields((prev) => new Set(prev).add(field))
        }
    }

    useEffect(() => {
        onSavingChange?.(isSaving)
        return () => onSavingChange?.(false)
    }, [isSaving, onSavingChange])

    const plnInputId = `${copy.idPrefix}NamePln`
    const engInputId = `${copy.idPrefix}NameEng`

    return (
        <div className="rounded-xl border border-border bg-background">
            <div className="border-b border-muted px-6 py-5">
                <h3 className="text-base font-bold text-foreground">
                    {item ? copy.editTitle : copy.createTitle}
                </h3>
            </div>

            <form action={formAction} noValidate className="flex flex-col gap-3 p-6">
                {item && <input type="hidden" name={copy.idFieldName} value={item.id} />}

                <Field data-invalid={Boolean(fieldError("namePln"))}>
                    <FieldLabel htmlFor={plnInputId} className="font-normal">
                        {copy.plnLabel}
                    </FieldLabel>
                    <Input
                        id={plnInputId}
                        name="namePln"
                        placeholder={copy.plnPlaceholder}
                        value={namePln}
                        aria-invalid={Boolean(fieldError("namePln"))}
                        onChange={(event) => {
                            setNamePln(event.target.value)
                            markEdited("namePln")
                        }}
                        className="h-10"
                    />
                    <FieldError>{fieldError("namePln")}</FieldError>
                </Field>

                <Field data-invalid={Boolean(fieldError("nameEng"))}>
                    <FieldLabel htmlFor={engInputId} className="font-normal">
                        {copy.engLabel}
                    </FieldLabel>
                    <Input
                        id={engInputId}
                        name="nameEng"
                        placeholder={copy.engPlaceholder}
                        value={nameEng}
                        aria-invalid={Boolean(fieldError("nameEng"))}
                        onChange={(event) => {
                            setNameEng(event.target.value)
                            markEdited("nameEng")
                        }}
                        className="h-10"
                    />
                    <FieldError>{fieldError("nameEng")}</FieldError>
                </Field>

                {state.formError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                        {state.formError}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        aria-busy={isSaving}
                        className="h-10 flex-1 bg-foreground font-normal text-background hover:bg-foreground/90"
                    >
                        {isSaving
                            ? "Zapisywanie…"
                            : item
                              ? copy.editSubmitLabel
                              : copy.createSubmitLabel}
                    </Button>
                    {item && onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-10"
                            disabled={isSaving}
                            onClick={onCancel}
                        >
                            Anuluj
                        </Button>
                    )}
                </div>

                {footer}
            </form>
        </div>
    )
}
