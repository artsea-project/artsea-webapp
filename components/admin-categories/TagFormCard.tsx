"use client"

import { Info } from "lucide-react"

import { createTag, updateTag } from "@/app/admin/categories/actions"
import BilingualNameFormCard, {
    type BilingualNameFormCopy,
} from "@/components/admin-categories/BilingualNameFormCard"
import type { AdminTag } from "@/lib/categories/queries"

const tagFormCopy: BilingualNameFormCopy = {
    idPrefix: "tag",
    idFieldName: "tagId",
    createTitle: "Dodaj nowy tag",
    editTitle: "Edytuj tag",
    plnLabel: "Nazwa tagu PL",
    plnPlaceholder: "Dodaj nowy tag wyświetlany w języku polskim",
    engLabel: "Nazwa tagu EN",
    engPlaceholder: "Dodaj nowy tag wyświetlany w języku angielskim",
    createSubmitLabel: "Dodaj Tag",
    editSubmitLabel: "Zapisz Tag",
    createdMessage: "Dodano tag.",
    updatedMessage: "Zapisano tag.",
    saveErrorMessage: "Nie udało się zapisać tagu. Spróbuj ponownie.",
}

interface TagFormCardProps {
    tag?: AdminTag
    onDone: (message: string) => void
    onCancel?: () => void
}

export default function TagFormCard({ tag, onDone, onCancel }: TagFormCardProps) {
    return (
        <BilingualNameFormCard
            item={
                tag
                    ? {
                          id: tag.tagId,
                          namePln: tag.namePln,
                          nameEng: tag.nameEng,
                      }
                    : undefined
            }
            copy={tagFormCopy}
            createAction={createTag}
            updateAction={updateTag}
            onDone={onDone}
            onCancel={onCancel}
            footer={
                <div className="mt-1 flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5 text-[13px] leading-tight text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p>
                        Tagi powinny być krótkie. Znak &apos;#&apos; doda się automatycznie podczas
                        zapisu.
                    </p>
                </div>
            }
        />
    )
}
