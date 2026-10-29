"use client"

import { useId, useState } from "react"

import CategoryRow from "@/components/admin-categories/CategoryRow"
import ExpandToggle from "@/components/admin-categories/ExpandToggle"
import type { AdminCategory } from "@/lib/categories/queries"

const COLLAPSED_LIMIT = 6

interface CategoriesTableProps {
    categories: AdminCategory[]
    isDeleting?: boolean
    selectedCategoryId?: string
    onEdit: (category: AdminCategory) => void
    onDelete: (category: AdminCategory) => void
}

export default function CategoriesTable({
    categories,
    isDeleting = false,
    selectedCategoryId,
    onEdit,
    onDelete,
}: CategoriesTableProps) {
    const [expanded, setExpanded] = useState(false)
    const tableId = useId()

    const hiddenCount = Math.max(categories.length - COLLAPSED_LIMIT, 0)
    const visibleCategories = expanded ? categories : categories.slice(0, COLLAPSED_LIMIT)

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="overflow-x-auto">
                <table id={tableId} className="w-full min-w-md border-collapse text-left">
                    <thead>
                        <tr className="h-14 border-b border-border bg-border/50 text-sm font-normal text-muted-foreground">
                            <th scope="col" className="px-6 py-3 font-normal">
                                Nazwa kategorii
                            </th>
                            <th scope="col" className="px-6 py-3 font-normal">
                                Liczba prac
                            </th>
                            <th scope="col" className="px-6 py-3 text-right font-normal">
                                Akcje
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {categories.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                                >
                                    Brak kategorii. Dodaj pierwszą kategorię w formularzu obok.
                                </td>
                            </tr>
                        ) : (
                            visibleCategories.map((category) => (
                                <CategoryRow
                                    key={category.categoryId}
                                    category={category}
                                    isSelected={category.categoryId === selectedCategoryId}
                                    isDeleting={isDeleting}
                                    onEdit={() => onEdit(category)}
                                    onDelete={() => onDelete(category)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {hiddenCount > 0 && (
                <div className="border-t border-border">
                    <ExpandToggle
                        expanded={expanded}
                        hiddenCount={hiddenCount}
                        controlsId={tableId}
                        onToggle={() => setExpanded((value) => !value)}
                    />
                </div>
            )}
        </div>
    )
}
