"use client"

import { useActionState, useState } from "react"
import { Plus } from "lucide-react"

import { createLink, updateLink } from "@/app/admin/profile/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { initialLinkFormState, type LinkFormState } from "@/lib/profile/form-state"
import type { ProfileLink } from "@/lib/profile/queries"

interface LinkPanelProps {
    link?: ProfileLink
    onDone: (message: string) => void
    onCancel: () => void
}

export default function LinkPanel({ link, onDone, onCancel }: LinkPanelProps) {
    const [name, setName] = useState(link?.name ?? "")
    const [url, setUrl] = useState(link?.url ?? "")

    const [state, formAction, isSaving] = useActionState(
        async (previous: LinkFormState, formData: FormData) => {
            const result = await (link ? updateLink : createLink)(previous, formData)
            if (result.status === "success") onDone(link ? "Zapisano link." : "Dodano link.")
            return result
        },
        initialLinkFormState
    )

    return (
        <form
            action={formAction}
            noValidate
            className="flex flex-col gap-4 rounded-lg border border-border bg-muted p-5"
        >
            <h4 className="text-sm font-bold text-foreground">
                {link ? "Edytuj link" : "Nowy link"}
            </h4>
            {link && <input type="hidden" name="linkId" value={link.linkId} />}

            <div className="grid gap-6 sm:grid-cols-2">
                <Field data-invalid={Boolean(state.fieldErrors.name)}>
                    <FieldLabel htmlFor="linkName">Wyświetlany tekst</FieldLabel>
                    <Input
                        id="linkName"
                        name="name"
                        placeholder="np. Instagram"
                        value={name}
                        aria-invalid={Boolean(state.fieldErrors.name)}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <FieldDescription>Tak link będzie podpisany na stronie.</FieldDescription>
                    <FieldError>{state.fieldErrors.name}</FieldError>
                </Field>

                <Field data-invalid={Boolean(state.fieldErrors.url)}>
                    <FieldLabel htmlFor="linkUrl">Link</FieldLabel>
                    <Input
                        id="linkUrl"
                        name="url"
                        placeholder="np. instagram.com/twoj-profil"
                        value={url}
                        aria-invalid={Boolean(state.fieldErrors.url)}
                        onChange={(event) => setUrl(event.target.value)}
                    />
                    <FieldDescription>
                        Możesz pominąć https://, zostanie dodane automatycznie.
                    </FieldDescription>
                    <FieldError>{state.fieldErrors.url}</FieldError>
                </Field>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" variant="outline" disabled={isSaving}>
                    {link ? (
                        "Zapisz link"
                    ) : (
                        <>
                            <Plus />
                            Dodaj link
                        </>
                    )}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Anuluj
                </Button>
            </div>
        </form>
    )
}
