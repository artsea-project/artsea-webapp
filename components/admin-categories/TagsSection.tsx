"use client"

import { useState, useTransition } from "react"

import { deleteTag } from "@/app/admin/categories/actions"
import SectionHeader, { type StatusNotice } from "@/components/admin-categories/SectionHeader"
import TagFormCard from "@/components/admin-categories/TagFormCard"
import TagsListCard from "@/components/admin-categories/TagsListCard"
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
import type { AdminTag } from "@/lib/categories/queries"

interface TagsSectionProps {
    tags: AdminTag[]
}

export default function TagsSection({ tags }: TagsSectionProps) {
    const [editingTag, setEditingTag] = useState<AdminTag | undefined>(undefined)
    const [notice, setNotice] = useState<StatusNotice | null>(null)
    const [tagToDelete, setTagToDelete] = useState<AdminTag | null>(null)
    const [isDeleting, startDeleting] = useTransition()

    function finishPanel(doneMessage: string) {
        setEditingTag(undefined)
        setNotice({ text: doneMessage, isError: false })
    }

    function confirmDelete() {
        if (!tagToDelete || isDeleting) return

        const { tagId } = tagToDelete

        startDeleting(async () => {
            let result: Awaited<ReturnType<typeof deleteTag>>
            try {
                result = await deleteTag(tagId)
            } catch {
                setNotice({ text: "Nie udało się usunąć tagu. Spróbuj ponownie.", isError: true })
                return
            }

            if (result.status === "error") {
                setNotice({ text: result.error, isError: true })
                return
            }

            setEditingTag((current) => (current?.tagId === tagId ? undefined : current))
            setNotice({ text: "Usunięto tag.", isError: false })
        })
    }

    return (
        <section className="flex flex-col gap-6">
            <SectionHeader
                title="Zarządzaj Tagami"
                description="Dodawaj nowe tagi, aby móc kategoryzować i filtrować swoje prace w portfolio."
                notice={notice}
            />

            <div className="grid items-start gap-6 lg:grid-cols-[11fr_14fr]">
                <TagFormCard
                    key={editingTag?.tagId ?? "new"}
                    tag={editingTag}
                    onDone={finishPanel}
                    onCancel={() => setEditingTag(undefined)}
                />
                <TagsListCard
                    tags={tags}
                    isDeleting={isDeleting}
                    selectedTagId={editingTag?.tagId}
                    onEdit={(tag) => {
                        setNotice(null)
                        setEditingTag(tag)
                    }}
                    onDelete={(tag) => {
                        setNotice(null)
                        setTagToDelete(tag)
                    }}
                />
            </div>

            <AlertDialog
                open={tagToDelete !== null}
                onOpenChange={(open) => !open && setTagToDelete(null)}
            >
                <AlertDialogContent className="admin-theme font-secondary text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć tag?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tag #{tagToDelete?.namePln || tagToDelete?.nameEng} zniknie z listy
                            dostępnych tagów i zostanie odpięty od wszystkich prac.
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
