import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AdminCategory } from "@/lib/categories/queries"
import { formatWorksCount } from "@/lib/categories/validation"
import { cn } from "@/lib/utils"

interface CategoryRowProps {
    category: AdminCategory
    isSelected?: boolean
    isDeleting?: boolean
    onEdit: () => void
    onDelete: () => void
}

export default function CategoryRow({
    category,
    isSelected = false,
    isDeleting = false,
    onEdit,
    onDelete,
}: CategoryRowProps) {
    return (
        <tr
            className={cn(
                "h-18 transition-colors hover:bg-muted/40",
                isSelected && "relative z-10 outline outline-1 -outline-offset-1 outline-primary"
            )}
        >
            <td className="max-w-0 w-full py-3 pr-2 pl-4 sm:px-6">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-normal text-foreground">
                        {category.namePln}
                    </span>
                    <span className="truncate text-[11px] font-normal text-foreground/60">
                        {category.nameEng}
                    </span>
                </div>
            </td>
            <td className="px-2 py-3 whitespace-nowrap sm:px-6">
                <span className="inline-flex h-7 items-center rounded-md bg-muted px-3 text-xs font-normal text-muted-foreground">
                    {formatWorksCount(category.worksCount)}
                </span>
            </td>
            <td className="py-3 pr-2 pl-2 text-right whitespace-nowrap sm:px-6">
                <div className="inline-flex items-center justify-end gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        aria-label={`Edytuj kategorię ${category.namePln}`}
                        onClick={onEdit}
                    >
                        <Pencil />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Usuń kategorię ${category.namePln}`}
                        disabled={isDeleting}
                        onClick={onDelete}
                    >
                        <Trash2 />
                    </Button>
                </div>
            </td>
        </tr>
    )
}
