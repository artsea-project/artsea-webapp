import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ProfileLink } from "@/lib/profile/queries"
import { displayLinkUrl } from "@/lib/profile/validation"

interface LinkRowProps {
    link: ProfileLink
    onEdit: () => void
    onDelete: () => void
}

export default function LinkRow({ link, onEdit, onDelete }: LinkRowProps) {
    return (
        <li className="flex items-center gap-4 rounded-md border border-border bg-background py-3 pr-2 pl-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-medium text-foreground">{link.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                    {displayLinkUrl(link.url)}
                </span>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                aria-label={`Edytuj link ${link.name}`}
                onClick={onEdit}
            >
                <Pencil />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                aria-label={`Usuń link ${link.name}`}
                onClick={onDelete}
            >
                <Trash2 />
            </Button>
        </li>
    )
}
