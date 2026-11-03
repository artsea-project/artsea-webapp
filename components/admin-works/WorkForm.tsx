"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useMemo, useRef, useState } from "react"

import { createWork, updateWork } from "@/app/admin/works/actions"
import CategoryPanel from "@/components/admin-categories/CategoryPanel"
import TagFormCard from "@/components/admin-categories/TagFormCard"
import BilingualTextField, {
    type BilingualTexts,
} from "@/components/admin-profile/BilingualTextField"
import { useLeaveGuard } from "@/components/admin-profile/LeaveGuard"
import SearchableOptionList, {
    type ChecklistOption,
} from "@/components/admin-works/SearchableOptionList"
import {
    descriptionFieldCopy,
    techniqueFieldCopy,
    titleFieldCopy,
} from "@/components/admin-works/work-text-fields"
import WorkMediaManager, {
    toInitialMediaItems,
    type EditableMediaItem,
} from "@/components/admin-works/WorkMediaManager"
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { AdminTag } from "@/lib/categories/queries"
import { resolveLocalizedLabel } from "@/lib/localized-labels"
import { initialWorkFormState, type WorkField, type WorkFormState } from "@/lib/works/form-state"
import type { WorkCategoryOption, WorkForEdit } from "@/lib/works/queries"

interface WorkFormProps {
    work?: WorkForEdit
    categories: WorkCategoryOption[]
    tags: AdminTag[]
}

type WorkDraft = {
    title: BilingualTexts
    dimensions: string
    yearOfExecution: string
    technique: BilingualTexts
    description: BilingualTexts
    categoryId: string
    tagIds: string[]
}

function draftFromWork(work?: WorkForEdit): WorkDraft {
    return {
        title: {
            pln: work?.titlePln ?? "",
            eng: work?.titleEng ?? "",
        },
        dimensions: work?.dimensions ?? "",
        yearOfExecution:
            work?.yearOfExecution !== null && work?.yearOfExecution !== undefined
                ? String(work.yearOfExecution)
                : "",
        technique: {
            pln: work?.descriptionPln.technique ?? "",
            eng: work?.descriptionEng.technique ?? "",
        },
        description: {
            pln: work?.descriptionPln.description ?? "",
            eng: work?.descriptionEng.description ?? "",
        },
        categoryId: work?.categoryId ?? "",
        tagIds: work?.tagIds ? [...work.tagIds] : [],
    }
}

function sameStringSet(left: string[], right: string[]): boolean {
    if (left.length !== right.length) return false
    const rightSet = new Set(right)
    return left.every((id) => rightSet.has(id))
}

function mediaOrderDiffers(items: EditableMediaItem[], initialKeys: string[]): boolean {
    if (items.length !== initialKeys.length) return true
    return items.some((item, index) => item.key !== initialKeys[index])
}

function differsFromSaved(
    draft: WorkDraft,
    saved: WorkDraft,
    mediaItems: EditableMediaItem[],
    initialMediaKeys: string[]
): boolean {
    return (
        draft.title.pln.trim() !== saved.title.pln.trim() ||
        draft.title.eng.trim() !== saved.title.eng.trim() ||
        draft.dimensions.trim() !== saved.dimensions.trim() ||
        draft.yearOfExecution.trim() !== saved.yearOfExecution.trim() ||
        draft.technique.pln.trim() !== saved.technique.pln.trim() ||
        draft.technique.eng.trim() !== saved.technique.eng.trim() ||
        draft.description.pln.trim() !== saved.description.pln.trim() ||
        draft.description.eng.trim() !== saved.description.eng.trim() ||
        draft.categoryId !== saved.categoryId ||
        !sameStringSet(draft.tagIds, saved.tagIds) ||
        mediaOrderDiffers(mediaItems, initialMediaKeys)
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

function formatTagLabel(tag: AdminTag): string {
    return `#${resolveLocalizedLabel(tag.namePln, tag.nameEng, "")}`
}

export default function WorkForm({ work, categories, tags }: WorkFormProps) {
    const router = useRouter()
    const formRef = useRef<HTMLFormElement>(null)

    const savedDraft = useMemo(() => draftFromWork(work), [work])
    const initialMedia = useMemo(() => toInitialMediaItems(work?.media ?? []), [work])
    const initialMediaKeys = useMemo(() => initialMedia.map((item) => item.key), [initialMedia])

    const [draft, setDraft] = useState<WorkDraft>(savedDraft)
    const [mediaItems, setMediaItems] = useState<EditableMediaItem[]>(initialMedia)
    const [isAddingCategory, setIsAddingCategory] = useState(false)
    const [isAddingTag, setIsAddingTag] = useState(false)

    const categoryOptions = useMemo<ChecklistOption[]>(
        () =>
            categories.map((category) => ({
                id: category.categoryId,
                label: category.namePln,
                searchTerms: `${category.namePln} ${category.nameEng}`,
            })),
        [categories]
    )

    const tagOptions = useMemo<ChecklistOption[]>(
        () =>
            tags.map((tag) => ({
                id: tag.tagId,
                label: formatTagLabel(tag),
                searchTerms: `${tag.namePln ?? ""} ${tag.nameEng ?? ""}`,
            })),
        [tags]
    )

    const [state, formAction, isSaving] = useActionState(
        async (previous: WorkFormState, formData: FormData): Promise<WorkFormState> => {
            formData.set("mediaOrderSubmitted", "1")
            formData.delete("mediaOrder")
            formData.delete("newMedia")

            let newIndex = 0
            for (const item of mediaItems) {
                if (item.kind === "existing") {
                    formData.append("mediaOrder", `existing:${item.mediaId}`)
                } else {
                    formData.append("mediaOrder", `new:${newIndex}`)
                    formData.append("newMedia", item.file)
                    newIndex += 1
                }
            }

            let result: WorkFormState
            try {
                result = await (work ? updateWork : createWork)(previous, formData)
            } catch {
                return {
                    status: "error",
                    fieldErrors: {},
                    formError: "Nie udało się zapisać pracy. Spróbuj ponownie.",
                }
            }

            if (result.status === "success") {
                router.push("/admin/works")
            }
            return result
        },
        initialWorkFormState
    )

    useEffect(() => {
        if (state.status === "error") revealFirstError(formRef.current)
    }, [state])

    const [errorsState, setErrorsState] = useState(state)
    const [editedFields, setEditedFields] = useState<ReadonlySet<WorkField>>(new Set())
    if (state !== errorsState) {
        setErrorsState(state)
        setEditedFields(new Set())
    }

    function fieldError(...fields: WorkField[]) {
        for (const field of fields) {
            if (!editedFields.has(field) && state.fieldErrors[field]) {
                return state.fieldErrors[field]
            }
        }
        return undefined
    }

    function markEdited(...fields: WorkField[]) {
        const next = new Set(editedFields)
        let changed = false
        for (const field of fields) {
            if (!next.has(field)) {
                next.add(field)
                changed = true
            }
        }
        if (changed) setEditedFields(next)
    }

    const isDirty = differsFromSaved(draft, savedDraft, mediaItems, initialMediaKeys)
    const leaveDialog = useLeaveGuard(
        isDirty && state.status !== "success",
        "Jeśli wyjdziesz, niezapisane zmiany w pracy przepadną."
    )

    function toggleTag(tagId: string) {
        setDraft((current) => ({
            ...current,
            tagIds: current.tagIds.includes(tagId)
                ? current.tagIds.filter((existing) => existing !== tagId)
                : [...current.tagIds, tagId],
        }))
    }

    return (
        <section className="relative flex max-w-196 flex-col gap-6">
            <header>
                <h2 className="text-2xl font-bold text-foreground">
                    {work ? "Edytuj pracę" : "Dodaj pracę"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Dodawaj nowy projekt oraz edytuj informacje o nim.
                </p>
            </header>

            <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-6">
                {work && <input type="hidden" name="artPieceId" value={work.artPieceId} />}
                <input type="hidden" name="categoryId" value={draft.categoryId} />
                {draft.tagIds.map((tagId) => (
                    <input key={tagId} type="hidden" name="tagIds" value={tagId} />
                ))}

                <FieldGroup className="[&_[data-slot=field-label]]:font-bold">
                    <BilingualTextField
                        copy={titleFieldCopy}
                        texts={draft.title}
                        error={fieldError("titlePln", "titleEng")}
                        onChange={(language, text) => {
                            setDraft({ ...draft, title: { ...draft.title, [language]: text } })
                            markEdited("titlePln", "titleEng")
                        }}
                    />

                    <Field data-invalid={Boolean(fieldError("yearOfExecution"))}>
                        <FieldLabel htmlFor="workYearOfExecution" className="font-bold">
                            Rok wykonania
                        </FieldLabel>
                        <Input
                            id="workYearOfExecution"
                            name="yearOfExecution"
                            inputMode="numeric"
                            value={draft.yearOfExecution}
                            placeholder="Podaj rok …"
                            aria-invalid={Boolean(fieldError("yearOfExecution"))}
                            onChange={(event) => {
                                setDraft({ ...draft, yearOfExecution: event.target.value })
                                markEdited("yearOfExecution")
                            }}
                        />
                        <FieldError>{fieldError("yearOfExecution")}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="workDimensions" className="font-bold">
                            Wymiary
                        </FieldLabel>
                        <Input
                            id="workDimensions"
                            name="dimensions"
                            value={draft.dimensions}
                            placeholder="Podaj wymiary dzieła ..."
                            onChange={(event) =>
                                setDraft({ ...draft, dimensions: event.target.value })
                            }
                        />
                        <FieldDescription>
                            Wymiary możesz podać w dowolnym formacie
                        </FieldDescription>
                    </Field>

                    <BilingualTextField
                        copy={techniqueFieldCopy}
                        texts={draft.technique}
                        error={fieldError("techniquePln", "techniqueEng")}
                        onChange={(language, text) => {
                            setDraft({
                                ...draft,
                                technique: { ...draft.technique, [language]: text },
                            })
                            markEdited("techniquePln", "techniqueEng")
                        }}
                    />

                    <BilingualTextField
                        copy={descriptionFieldCopy}
                        texts={draft.description}
                        error={fieldError("descriptionPln", "descriptionEng")}
                        onChange={(language, text) => {
                            setDraft({
                                ...draft,
                                description: { ...draft.description, [language]: text },
                            })
                            markEdited("descriptionPln", "descriptionEng")
                        }}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <SearchableOptionList
                            label="Kategorie"
                            searchPlaceholder="Szukaj kategorii..."
                            options={categoryOptions}
                            selectedIds={draft.categoryId ? [draft.categoryId] : []}
                            error={fieldError("categoryId")}
                            headerAction={
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                >
                                    <Plus aria-hidden="true" className="size-3.5" />
                                    Dodaj kategorię
                                </button>
                            }
                            onToggle={(categoryId) => {
                                setDraft((current) => ({
                                    ...current,
                                    categoryId: current.categoryId === categoryId ? "" : categoryId,
                                }))
                                markEdited("categoryId")
                            }}
                        />

                        <SearchableOptionList
                            label="Tagi"
                            searchPlaceholder="Szukaj tagu..."
                            options={tagOptions}
                            selectedIds={draft.tagIds}
                            headerAction={
                                <button
                                    type="button"
                                    onClick={() => setIsAddingTag(true)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                >
                                    <Plus aria-hidden="true" className="size-3.5" />
                                    Dodaj tag
                                </button>
                            }
                            onToggle={toggleTag}
                        />
                    </div>
                </FieldGroup>

                <WorkMediaManager items={mediaItems} onChange={setMediaItems} />

                {state.formError && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                        {state.formError}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={isSaving || !isDirty}
                        aria-busy={isSaving}
                        className="bg-foreground text-background hover:bg-foreground/90"
                    >
                        {isSaving ? "Zapisywanie…" : "Zapisz zmiany"}
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin/works">Anuluj</Link>
                    </Button>
                </div>

                {leaveDialog}
            </form>

            <AlertDialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                <AlertDialogContent
                    data-leave-guard-root
                    className="admin-theme border-0 bg-transparent p-0 font-secondary text-foreground shadow-none sm:max-w-lg"
                >
                    <AlertDialogTitle className="sr-only">Dodaj nową kategorię</AlertDialogTitle>
                    <CategoryPanel
                        alwaysShowCancel
                        onCancel={() => setIsAddingCategory(false)}
                        onDone={(_message, createdCategoryId) => {
                            setIsAddingCategory(false)
                            if (createdCategoryId) {
                                setDraft((current) => ({
                                    ...current,
                                    categoryId: createdCategoryId,
                                }))
                                markEdited("categoryId")
                            }
                        }}
                    />
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isAddingTag} onOpenChange={setIsAddingTag}>
                <AlertDialogContent
                    data-leave-guard-root
                    className="admin-theme border-0 bg-transparent p-0 font-secondary text-foreground shadow-none sm:max-w-lg"
                >
                    <AlertDialogTitle className="sr-only">Dodaj nowy tag</AlertDialogTitle>
                    <TagFormCard
                        alwaysShowCancel
                        onCancel={() => setIsAddingTag(false)}
                        onDone={(_message, createdTagId) => {
                            setIsAddingTag(false)
                            if (createdTagId) {
                                setDraft((current) => ({
                                    ...current,
                                    tagIds: current.tagIds.includes(createdTagId)
                                        ? current.tagIds
                                        : [...current.tagIds, createdTagId],
                                }))
                            }
                        }}
                    />
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}
