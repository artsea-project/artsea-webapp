"use client"

import { useState, useTransition, type ReactNode } from "react"

import type { DeleteResult } from "@/app/admin/categories/actions"
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

interface CatalogSectionFormRenderProps<T> {
    editingItem: T | undefined
    onDone: (message: string) => void
    onCancel: () => void
    onSavingChange: (isSaving: boolean) => void
}

interface CatalogSectionListRenderProps<T> {
    isDeleting: boolean
    selectedId: string | undefined
    onEdit: (item: T) => void
    onDelete: (item: T) => void
}

interface CatalogSectionProps<T> {
    title: string
    description: string
    getId: (item: T) => string
    deleteAction: (id: string) => Promise<DeleteResult>
    deletedMessage: string
    deleteFailureMessage: string
    deleteDialogTitle: string
    deleteDialogDescription: (item: T) => string
    renderForm: (props: CatalogSectionFormRenderProps<T>) => ReactNode
    renderList: (props: CatalogSectionListRenderProps<T>) => ReactNode
}

export default function CatalogSection<T>({
    title,
    description,
    getId,
    deleteAction,
    deletedMessage,
    deleteFailureMessage,
    deleteDialogTitle,
    deleteDialogDescription,
    renderForm,
    renderList,
}: CatalogSectionProps<T>) {
    const [editingItem, setEditingItem] = useState<T | undefined>(undefined)
    const [notice, setNotice] = useState<StatusNotice | null>(null)
    const [itemToDelete, setItemToDelete] = useState<T | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, startDeleting] = useTransition()

    function finishPanel(doneMessage: string) {
        setEditingItem(undefined)
        setNotice({ text: doneMessage, isError: false })
    }

    function confirmDelete() {
        if (!itemToDelete || isDeleting) return

        const targetId = getId(itemToDelete)

        startDeleting(async () => {
            let result: DeleteResult
            try {
                result = await deleteAction(targetId)
            } catch {
                setNotice({ text: deleteFailureMessage, isError: true })
                return
            }

            if (result.status === "error") {
                setNotice({ text: result.error, isError: true })
                return
            }

            // Close the edit panel only once the item is actually gone,
            // so a rejected delete doesn't discard unsaved edits.
            setEditingItem((current) =>
                current && getId(current) === targetId ? undefined : current
            )
            setNotice({ text: deletedMessage, isError: false })
        })
    }

    const selectedId = editingItem ? getId(editingItem) : undefined

    return (
        <section className="flex flex-col gap-6">
            <SectionHeader title={title} description={description} notice={notice} />

            <div className="grid gap-6 lg:grid-cols-[11fr_14fr]">
                {renderForm({
                    editingItem,
                    onDone: finishPanel,
                    onCancel: () => setEditingItem(undefined),
                    onSavingChange: setIsSaving,
                })}

                <div className="lg:relative">
                    {renderList({
                        isDeleting: isDeleting || isSaving,
                        selectedId,
                        onEdit: (item) => {
                            if (isSaving || isDeleting) return
                            setNotice(null)
                            setEditingItem(item)
                        },
                        onDelete: (item) => {
                            if (isSaving || isDeleting) return
                            setNotice(null)
                            setItemToDelete(item)
                        },
                    })}
                </div>
            </div>

            <AlertDialog
                open={itemToDelete !== null}
                onOpenChange={(open) => !open && setItemToDelete(null)}
            >
                <AlertDialogContent className="admin-theme font-secondary text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{deleteDialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {itemToDelete ? deleteDialogDescription(itemToDelete) : ""}
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
