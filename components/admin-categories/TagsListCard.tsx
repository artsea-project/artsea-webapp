"use client"

import { useId, useState } from "react"
import { Search } from "lucide-react"

import ExpandToggle from "@/components/admin-categories/ExpandToggle"
import TagPill from "@/components/admin-categories/TagPill"
import { Input } from "@/components/ui/input"
import type { AdminTag } from "@/lib/categories/queries"
import { normalizeTagName } from "@/lib/categories/validation"

const COLLAPSED_LIMIT = 16

interface TagsListCardProps {
    tags: AdminTag[]
    isDeleting?: boolean
    onDelete: (tag: AdminTag) => void
}

export default function TagsListCard({ tags, isDeleting = false, onDelete }: TagsListCardProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [expanded, setExpanded] = useState(false)
    const listId = useId()
    const normalizedQuery = normalizeTagName(searchQuery).toLowerCase()

    const filteredTags = normalizedQuery
        ? tags.filter((tag) => {
              const pln = (tag.namePln ?? "").toLowerCase()
              const eng = (tag.nameEng ?? "").toLowerCase()
              return pln.includes(normalizedQuery) || eng.includes(normalizedQuery)
          })
        : tags

    const hiddenCount = Math.max(filteredTags.length - COLLAPSED_LIMIT, 0)
    const visibleTags = expanded ? filteredTags : filteredTags.slice(0, COLLAPSED_LIMIT)

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
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

            <div className="p-6">
                {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Brak dostępnych tagów. Dodaj pierwszy tag w formularzu obok.
                    </p>
                ) : filteredTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Brak tagów pasujących do wyszukiwania.
                    </p>
                ) : (
                    <div id={listId} className="flex flex-wrap gap-4">
                        {visibleTags.map((tag) => (
                            <TagPill
                                key={tag.tagId}
                                namePln={tag.namePln}
                                nameEng={tag.nameEng}
                                disabled={isDeleting}
                                onDelete={() => onDelete(tag)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {hiddenCount > 0 && (
                <div className="border-t border-border">
                    <ExpandToggle
                        expanded={expanded}
                        hiddenCount={hiddenCount}
                        controlsId={listId}
                        onToggle={() => setExpanded((value) => !value)}
                    />
                </div>
            )}
        </div>
    )
}
