"use client"

import { createCategory, updateCategory } from "@/app/admin/categories/actions"
import BilingualNameFormCard, {
    type BilingualNameFormCopy,
} from "@/components/admin-categories/BilingualNameFormCard"
import type { AdminCategory } from "@/lib/categories/queries"

const categoryFormCopy: BilingualNameFormCopy = {
    idPrefix: "category",
    idFieldName: "categoryId",
    createTitle: "Dodaj nową kategorię",
    editTitle: "Edytuj kategorię",
    plnLabel: "Nazwa kategorii PL",
    plnPlaceholder: "Dodaj kategorię w języku polskim",
    engLabel: "Nazwa kategorii EN",
    engPlaceholder: "Dodaj kategorię w języku angielskim",
    createSubmitLabel: "Dodaj Kategorię",
    editSubmitLabel: "Zapisz Kategorię",
    createdMessage: "Dodano kategorię.",
    updatedMessage: "Zapisano kategorię.",
    saveErrorMessage: "Nie udało się zapisać kategorii. Spróbuj ponownie.",
}

interface CategoryPanelProps {
    category?: AdminCategory
    onDone: (message: string) => void
    onCancel?: () => void
    onSavingChange?: (isSaving: boolean) => void
}

export default function CategoryPanel({
    category,
    onDone,
    onCancel,
    onSavingChange,
}: CategoryPanelProps) {
    return (
        <BilingualNameFormCard
            item={
                category
                    ? {
                          id: category.categoryId,
                          namePln: category.namePln,
                          nameEng: category.nameEng,
                      }
                    : undefined
            }
            copy={categoryFormCopy}
            createAction={createCategory}
            updateAction={updateCategory}
            onDone={onDone}
            onCancel={onCancel}
            onSavingChange={onSavingChange}
        />
    )
}
