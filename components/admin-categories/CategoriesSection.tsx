"use client"

import { useState, useTransition } from "react"

import { deleteCategory } from "@/app/admin/categories/actions"
import CategoriesTable from "@/components/admin-categories/CategoriesTable"
import CategoryPanel from "@/components/admin-categories/CategoryPanel"
import SectionHeader, { type StatusNotice } from "@/components/admin-categories/SectionHeader"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { AdminCategory } from "@/lib/categories/queries"

interface CategoriesSectionProps {
    categories: AdminCategory[]
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
    const [editingCategory, setEditingCategory] = useState<AdminCategory | undefined>(undefined)
    const [notice, setNotice] = useState<StatusNotice | null>(null)
    const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null)
    const [isDeleting, startDeleting] = useTransition()

    function finishPanel(doneMessage: string) {
        setEditingCategory(undefined)
        setNotice({ text: doneMessage, isError: false })
    }

    function confirmDelete() {
        if (!categoryToDelete || isDeleting) return

        const { categoryId } = categoryToDelete

        startDeleting(async () => {
            let result: Awaited<ReturnType<typeof deleteCategory>>
            try {
                result = await deleteCategory(categoryId)
            } catch {
                setNotice({
                    text: "Nie udało się usunąć kategorii. Spróbuj ponownie.",
                    isError: true,
                })
                return
            }

            if (result.status === "error") {
                setNotice({ text: result.error, isError: true })
                return
            }

            // Close the edit panel only once the category is actually gone,
            // so a rejected delete doesn't discard unsaved edits.
            setEditingCategory((current) =>
                current?.categoryId === categoryId ? undefined : current
            )
            setNotice({ text: "Usunięto kategorię.", isError: false })
        })
    }

    return (
        <section className="flex flex-col gap-6">
            <SectionHeader
                title="Zarządzaj kategoriami"
                description="Dodawaj nowe kategorie i organizuj swoje projekty, aby ułatwić nawigację."
                notice={notice}
            />

            <div className="grid gap-6 lg:grid-cols-[11fr_14fr]">
                <CategoryPanel
                    key={editingCategory?.categoryId ?? "new"}
                    category={editingCategory}
                    onDone={finishPanel}
                    onCancel={() => setEditingCategory(undefined)}
                />

                <div className="lg:relative">
                    <CategoriesTable
                        categories={categories}
                        isDeleting={isDeleting}
                        selectedCategoryId={editingCategory?.categoryId}
                        onEdit={(category) => {
                            setNotice(null)
                            setEditingCategory(category)
                        }}
                        onDelete={(category) => {
                            setNotice(null)
                            setCategoryToDelete(category)
                        }}
                    />
                </div>
            </div>

            <AlertDialog
                open={categoryToDelete !== null}
                onOpenChange={(open) => !open && setCategoryToDelete(null)}
            >
                <AlertDialogContent className="admin-theme font-secondary text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć kategorię?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kategoria {categoryToDelete?.namePln} zniknie z listy dostępnych
                            kategorii.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={confirmDelete}
                        >
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}
