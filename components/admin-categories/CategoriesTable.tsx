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
            <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-md border-collapse text-left">
                    <thead className="sticky top-0 z-20 bg-background shadow-[inset_0_-1px_0_0_var(--border)]">
                        <tr className="h-14 bg-border/50 text-sm font-normal text-muted-foreground">
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
