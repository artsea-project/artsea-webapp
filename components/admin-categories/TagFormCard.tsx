"use client"

import { useActionState, useState } from "react"
import { Info } from "lucide-react"

import { createTag, updateTag } from "@/app/admin/categories/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { initialTagFormState, type TagFormState } from "@/lib/categories/form-state"
import type { AdminTag } from "@/lib/categories/queries"

interface TagFormCardProps {
    tag?: AdminTag
    onDone: (message: string) => void
    onCancel?: () => void
}

export default function TagFormCard({ tag, onDone, onCancel }: TagFormCardProps) {
    const [namePln, setNamePln] = useState(tag?.namePln ?? "")
    const [nameEng, setNameEng] = useState(tag?.nameEng ?? "")

    const [state, formAction, isSaving] = useActionState(
        async (previous: TagFormState, formData: FormData): Promise<TagFormState> => {
            let result: TagFormState
            try {
                result = await (tag ? updateTag : createTag)(previous, formData)
            } catch {
                return {
                    status: "error",
                    fieldErrors: {},
                    formError: "Nie udało się zapisać tagu. Spróbuj ponownie.",
                }
            }

            if (result.status === "success") {
                if (!tag) {
                    setNamePln("")
                    setNameEng("")
                }
                onDone(tag ? "Zapisano tag." : "Dodano tag.")
            }
            return result
        },
        initialTagFormState
    )

    return (
        <div className="rounded-xl border border-border bg-background">
            <div className="border-b border-muted px-6 py-5">
                <h3 className="text-base font-bold text-foreground">
                    {tag ? "Edytuj tag" : "Dodaj nowy tag"}
                </h3>
            </div>

            <form action={formAction} noValidate className="flex flex-col gap-4 p-6">
                {tag && <input type="hidden" name="tagId" value={tag.tagId} />}

                <Field data-invalid={Boolean(state.fieldErrors.namePln)}>
                    <FieldLabel htmlFor="tagNamePln" className="font-normal">
                        Nazwa tagu PL
                    </FieldLabel>
                    <Input
                        id="tagNamePln"
                        name="namePln"
                        placeholder="Dodaj nowy tag wyświetlany w języku polskim"
                        value={namePln}
                        aria-invalid={Boolean(state.fieldErrors.namePln)}
                        onChange={(event) => setNamePln(event.target.value)}
                        className="h-10"
                    />
                    <FieldError>{state.fieldErrors.namePln}</FieldError>
                </Field>

                <Field data-invalid={Boolean(state.fieldErrors.nameEng)}>
                    <FieldLabel htmlFor="tagNameEng" className="font-normal">
                        Nazwa tagu EN
                    </FieldLabel>
                    <Input
                        id="tagNameEng"
                        name="nameEng"
                        placeholder="Dodaj nowy tag wyświetlany w języku angielskim"
                        value={nameEng}
                        aria-invalid={Boolean(state.fieldErrors.nameEng)}
                        onChange={(event) => setNameEng(event.target.value)}
                        className="h-10"
                    />
                    <FieldError>{state.fieldErrors.nameEng}</FieldError>
                </Field>

                {state.formError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                        {state.formError}
                    </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        aria-busy={isSaving}
                        className="h-10 flex-1 bg-foreground font-normal text-background hover:bg-foreground/90"
                    >
                        {isSaving ? "Zapisywanie…" : tag ? "Zapisz Tag" : "Dodaj Tag"}
                    </Button>
                    {tag && onCancel && (
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

                <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5 text-[13px] leading-tight text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p>
                        Tagi powinny być krótkie. Znak &apos;#&apos; doda się automatycznie podczas
                        zapisu.
                    </p>
                </div>
            </form>
        </div>
    )
}
