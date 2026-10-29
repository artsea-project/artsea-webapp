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
    const [notice, setNotice] = useState<StatusNotice | null>(null)
    const [tagToDelete, setTagToDelete] = useState<AdminTag | null>(null)
    const [isDeleting, startDeleting] = useTransition()

    function confirmDelete() {
        if (!tagToDelete || isDeleting) return

        const { tagId } = tagToDelete

        startDeleting(async () => {
            try {
                await deleteTag(tagId)
            } catch {
                setNotice({ text: "Nie udało się usunąć tagu. Spróbuj ponownie.", isError: true })
                return
            }
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
                <TagFormCard onDone={(text) => setNotice({ text, isError: false })} />
                <TagsListCard
                    tags={tags}
                    isDeleting={isDeleting}
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
