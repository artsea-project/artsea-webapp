"use client"

import CategoryRow from "@/components/admin-categories/CategoryRow"
import type { AdminCategory } from "@/lib/categories/queries"

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
    return (
        <div className="flex max-h-80 flex-col overflow-hidden rounded-xl border border-border bg-background lg:absolute lg:inset-x-0 lg:top-0 lg:max-h-full">
            <div className="min-h-0 flex-1 overflow-y-auto">
                <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-20 bg-background shadow-[inset_0_-1px_0_0_var(--border)]">
                        <tr className="h-14 bg-border/50 text-sm font-normal text-muted-foreground">
                            <th scope="col" className="py-3 pr-2 pl-4 font-normal sm:px-6">
                                Nazwa kategorii
                            </th>
                            <th
                                scope="col"
                                className="px-2 py-3 font-normal whitespace-nowrap sm:px-6"
                            >
                                Liczba prac
                            </th>
                            <th
                                scope="col"
                                className="py-3 pr-2 pl-2 text-right font-normal whitespace-nowrap sm:px-6"
                            >
                                Akcje
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {categories.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6"
                                >
                                    Brak kategorii. Dodaj pierwszą kategorię w formularzu obok.
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => (
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
        </div>
    )
}
