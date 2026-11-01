"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import TagPill from "@/components/admin-categories/TagPill"
import { Input } from "@/components/ui/input"
import type { AdminTag } from "@/lib/categories/queries"
import { normalizeTagName } from "@/lib/categories/validation"

interface TagsListCardProps {
    tags: AdminTag[]
    isDeleting?: boolean
    selectedTagId?: string
    onEdit: (tag: AdminTag) => void
    onDelete: (tag: AdminTag) => void
}

export default function TagsListCard({
    tags,
    isDeleting = false,
    selectedTagId,
    onEdit,
    onDelete,
}: TagsListCardProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const normalizedQuery = normalizeTagName(searchQuery).toLowerCase()

    const filteredTags = normalizedQuery
        ? tags.filter((tag) => {
              const pln = (tag.namePln ?? "").toLowerCase()
              const eng = (tag.nameEng ?? "").toLowerCase()
              return pln.includes(normalizedQuery) || eng.includes(normalizedQuery)
          })
        : tags

    return (
        <div className="flex max-h-96 flex-col overflow-hidden rounded-xl border border-border bg-background lg:absolute lg:inset-x-0 lg:top-0 lg:max-h-full">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-muted px-6 py-4">
                <h3 className="text-base font-bold text-foreground">
                    Dostępne Tagi ({tags.length})
                </h3>

                <div className="relative w-full sm:w-55">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={searchQuery}
                        placeholder="Szukaj tagu..."
                        aria-label="Szukaj tagu"
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-9 rounded-[10px] bg-surface pl-9 text-[13px]"
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Brak dostępnych tagów. Dodaj pierwszy tag w formularzu obok.
                    </p>
                ) : filteredTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Brak tagów pasujących do wyszukiwania.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        {filteredTags.map((tag) => (
                            <TagPill
                                key={tag.tagId}
                                namePln={tag.namePln}
                                nameEng={tag.nameEng}
                                isSelected={tag.tagId === selectedTagId}
                                disabled={isDeleting}
                                onSelect={() => onEdit(tag)}
                                onDelete={() => onDelete(tag)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
