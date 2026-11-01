"use client"

import { deleteTag } from "@/app/admin/categories/actions"
import CatalogSection from "@/components/admin-categories/CatalogSection"
import TagFormCard from "@/components/admin-categories/TagFormCard"
import TagsListCard from "@/components/admin-categories/TagsListCard"
import type { AdminTag } from "@/lib/categories/queries"

interface TagsSectionProps {
    tags: AdminTag[]
}

export default function TagsSection({ tags }: TagsSectionProps) {
    return (
        <CatalogSection<AdminTag>
            title="Zarządzaj Tagami"
            description="Dodawaj nowe tagi, aby móc kategoryzować i filtrować swoje prace w portfolio."
            getId={(tag) => tag.tagId}
            deleteAction={deleteTag}
            deletedMessage="Usunięto tag."
            deleteFailureMessage="Nie udało się usunąć tagu. Spróbuj ponownie."
            deleteDialogTitle="Usunąć tag?"
            deleteDialogDescription={(tag) =>
                `Tag #${tag.namePln || tag.nameEng} zniknie z listy dostępnych tagów i zostanie odpięty od wszystkich prac.`
            }
            renderForm={({ editingItem, onDone, onCancel }) => (
                <TagFormCard
                    key={editingItem?.tagId ?? "new"}
                    tag={editingItem}
                    onDone={onDone}
                    onCancel={onCancel}
                />
            )}
            renderList={({ isDeleting, selectedId, onEdit, onDelete }) => (
                <TagsListCard
                    tags={tags}
                    isDeleting={isDeleting}
                    selectedTagId={selectedId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            )}
        />
    )
}
