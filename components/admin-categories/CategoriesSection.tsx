"use client"

import { deleteCategory } from "@/app/admin/categories/actions"
import CatalogSection from "@/components/admin-categories/CatalogSection"
import CategoriesTable from "@/components/admin-categories/CategoriesTable"
import CategoryPanel from "@/components/admin-categories/CategoryPanel"
import type { AdminCategory } from "@/lib/categories/queries"

interface CategoriesSectionProps {
    categories: AdminCategory[]
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
    return (
        <CatalogSection<AdminCategory>
            title="Zarządzaj kategoriami"
            description="Dodawaj nowe kategorie i organizuj swoje projekty, aby ułatwić nawigację."
            getId={(category) => category.categoryId}
            deleteAction={deleteCategory}
            deletedMessage="Usunięto kategorię."
            deleteFailureMessage="Nie udało się usunąć kategorii. Spróbuj ponownie."
            deleteDialogTitle="Usunąć kategorię?"
            deleteDialogDescription={(category) =>
                `Kategoria ${category.namePln} zniknie z listy dostępnych kategorii.`
            }
            renderForm={({ editingItem, onDone, onCancel, onSavingChange }) => (
                <CategoryPanel
                    key={editingItem?.categoryId ?? "new"}
                    category={editingItem}
                    onDone={onDone}
                    onCancel={onCancel}
                    onSavingChange={onSavingChange}
                />
            )}
            renderList={({ isDeleting, selectedId, onEdit, onDelete }) => (
                <CategoriesTable
                    categories={categories}
                    isDeleting={isDeleting}
                    selectedCategoryId={selectedId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )}
        />
    )
}
