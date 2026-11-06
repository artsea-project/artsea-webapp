import { Image as ImageIcon, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AdminWork } from "@/lib/works/queries"

interface WorkCardProps {
    work: AdminWork
    isBusy?: boolean
    onToggleVisibility: (work: AdminWork) => void
    onDelete: (work: AdminWork) => void
}

const uploadedDateFormatter = new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
})

export function formatUploadedDate(date: Date): string {
    const value = date instanceof Date ? date : new Date(date)
    return uploadedDateFormatter.format(value)
}

export default function WorkCard({
    work,
    isBusy = false,
    onToggleVisibility,
    onDelete,
}: WorkCardProps) {
    const { title } = work

    return (
        <article className="flex flex-col rounded-xl border border-border bg-background">
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg bg-muted/60">
                    {work.coverMediaId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={`/admin/media/${work.coverMediaId}`}
                            alt={title}
                            className="size-full object-cover"
                        />
                    ) : (
                        <ImageIcon aria-hidden="true" className="size-6 text-muted-foreground/70" />
                    )}
                </div>

                <div className="flex flex-col gap-1 pt-1">
                    <h3 className="line-clamp-1 text-base font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground">
                        Kategoria: {work.categoryNamePln}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                        Dodano: {formatUploadedDate(work.uploadedAt)}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-muted px-4 py-3">
                <button
                    type="button"
                    role="switch"
                    aria-checked={work.isVisible}
                    aria-label={`Widoczność pracy ${title}`}
                    disabled={isBusy}
                    onClick={() => onToggleVisibility(work)}
                    className="group inline-flex items-center gap-2.5 text-xs font-medium disabled:pointer-events-none disabled:opacity-50"
                >
                    <span
                        className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
                            work.isVisible ? "bg-foreground" : "bg-muted-foreground/25"
                        )}
                    >
                        <span
                            className={cn(
                                "size-4 rounded-full bg-background shadow-xs transition-transform",
                                work.isVisible ? "translate-x-4" : "translate-x-0"
                            )}
                        />
                    </span>
                    <span
                        className={cn(work.isVisible ? "text-foreground" : "text-muted-foreground")}
                    >
                        {work.isVisible ? "Widoczna" : "Ukryta"}
                    </span>
                </button>

                <div className="inline-flex items-center gap-1">
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "text-muted-foreground",
                            isBusy && "pointer-events-none opacity-50"
                        )}
                        aria-label={`Edytuj pracę ${title}`}
                    >
                        <Link
                            href={`/admin/works/${work.artPieceId}/edit`}
                            aria-disabled={isBusy}
                            tabIndex={isBusy ? -1 : undefined}
                        >
                            <Pencil />
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Usuń pracę ${title}`}
                        disabled={isBusy}
                        onClick={() => onDelete(work)}
                    >
                        <Trash2 />
                    </Button>
                </div>
            </div>
        </article>
    )
}
