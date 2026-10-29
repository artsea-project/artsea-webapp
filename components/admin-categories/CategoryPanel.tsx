"use client"

import { useActionState, useState } from "react"

import { createCategory, updateCategory } from "@/app/admin/categories/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { initialCategoryFormState, type CategoryFormState } from "@/lib/categories/form-state"
import type { AdminCategory } from "@/lib/categories/queries"

interface CategoryPanelProps {
    category?: AdminCategory
    onDone: (message: string) => void
    onCancel?: () => void
}

export default function CategoryPanel({ category, onDone, onCancel }: CategoryPanelProps) {
    const [namePln, setNamePln] = useState(category?.namePln ?? "")
    const [nameEng, setNameEng] = useState(category?.nameEng ?? "")

    const [state, formAction, isSaving] = useActionState(
        async (previous: CategoryFormState, formData: FormData): Promise<CategoryFormState> => {
            let result: CategoryFormState
            try {
                result = await (category ? updateCategory : createCategory)(previous, formData)
            } catch {
                return {
                    status: "error",
                    fieldErrors: {},
                    formError: "Nie udało się zapisać kategorii. Spróbuj ponownie.",
                }
            }

            if (result.status === "success") {
                if (!category) {
                    setNamePln("")
                    setNameEng("")
                }
                onDone(category ? "Zapisano kategorię." : "Dodano kategorię.")
            }
            return result
        },
        initialCategoryFormState
    )

    return (
        <div className="rounded-xl border border-border bg-background">
            <div className="border-b border-muted px-6 py-5">
                <h3 className="text-base font-bold text-foreground">
                    {category ? "Edytuj kategorię" : "Dodaj nową kategorię"}
                </h3>
            </div>

            <form action={formAction} noValidate className="flex flex-col gap-3 p-6">
                {category && <input type="hidden" name="categoryId" value={category.categoryId} />}

                <Field data-invalid={Boolean(state.fieldErrors.namePln)}>
                    <FieldLabel htmlFor="categoryNamePln" className="font-normal">
                        Nazwa kategorii PL
                    </FieldLabel>
                    <Input
                        id="categoryNamePln"
                        name="namePln"
                        placeholder="Dodaj nową kategorię wyświetlaną w języku polskim"
                        value={namePln}
                        aria-invalid={Boolean(state.fieldErrors.namePln)}
                        onChange={(event) => setNamePln(event.target.value)}
                        className="h-10"
                    />
                    <FieldError>{state.fieldErrors.namePln}</FieldError>
                </Field>

                <Field data-invalid={Boolean(state.fieldErrors.nameEng)}>
                    <FieldLabel htmlFor="categoryNameEng" className="font-normal">
                        Nazwa kategorii EN
                    </FieldLabel>
                    <Input
                        id="categoryNameEng"
                        name="nameEng"
                        placeholder="Dodaj nową kategorię wyświetlaną w języku angielskim"
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
                        {isSaving
                            ? "Zapisywanie…"
                            : category
                              ? "Zapisz Kategorię"
                              : "Dodaj Kategorię"}
                    </Button>
                    {category && onCancel && (
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
            </form>
        </div>
    )
}
