"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import { deleteWork, setWorkVisibility } from "@/app/admin/works/actions"
import type { StatusNotice } from "@/components/admin-categories/SectionHeader"
import WorkCard from "@/components/admin-works/WorkCard"
import WorksPagination from "@/components/admin-works/WorksPagination"
import WorksSearchBar from "@/components/admin-works/WorksSearchBar"
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
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AdminWork } from "@/lib/works/queries"

interface WorksSectionProps {
    works: AdminWork[]
    page: number
    pageCount: number
    search: string
}

export default function WorksSection({ works, page, pageCount, search }: WorksSectionProps) {
    const [notice, setNotice] = useState<StatusNotice | null>(null)
    const [workToDelete, setWorkToDelete] = useState<AdminWork | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleToggleVisibility(work: AdminWork) {
        if (isPending) return
        const nextVisible = !work.isVisible

        startTransition(async () => {
            let result: Awaited<ReturnType<typeof setWorkVisibility>>
            try {
                result = await setWorkVisibility(work.artPieceId, nextVisible)
            } catch {
                setNotice({
                    text: "Nie udało się zmienić widoczności pracy. Spróbuj ponownie.",
                    isError: true,
                })
                return
            }

            if (result.status === "error") {
                setNotice({ text: result.error, isError: true })
                return
            }

            setNotice({
                text: nextVisible ? "Praca jest teraz widoczna." : "Praca została ukryta.",
                isError: false,
            })
        })
    }

    function confirmDelete() {
        if (!workToDelete || isPending) return
        const { artPieceId } = workToDelete

        startTransition(async () => {
            let result: Awaited<ReturnType<typeof deleteWork>>
            try {
                result = await deleteWork(artPieceId)
            } catch {
                setNotice({
                    text: "Nie udało się usunąć pracy. Spróbuj ponownie.",
                    isError: true,
                })
                return
            }

            if (result.status === "error") {
                setNotice({ text: result.error, isError: true })
                return
            }

            setWorkToDelete(null)
            setNotice({ text: "Usunięto pracę.", isError: false })
        })
    }

    const deleteTitle = workToDelete?.title ?? "Bez tytułu"

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Zarządzaj pracami</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Dodawaj nowe projekty, edytuj informacje oraz zmieniaj ich widoczność w
                        portfolio.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <p
                        role="status"
                        className={cn(
                            "text-sm",
                            notice?.isError
                                ? "font-medium text-destructive"
                                : "text-muted-foreground"
                        )}
                    >
                        {notice?.text ?? ""}
                    </p>

                    <Button
                        asChild
                        className="h-10 rounded-lg bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90"
                    >
                        <Link href="/admin/works/new">
                            <Plus className="size-4" />
                            Dodaj pracę
                        </Link>
                    </Button>
                </div>
            </div>

            <WorksSearchBar key={search} initialSearch={search} />

            {works.length === 0 ? (
                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-background p-8 text-sm text-muted-foreground">
                    {search
                        ? "Nie znaleziono prac pasujących do wyszukiwanej frazy."
                        : "Nie dodano jeszcze żadnych prac."}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {works.map((work) => (
                        <WorkCard
                            key={work.artPieceId}
                            work={work}
                            isBusy={isPending}
                            onToggleVisibility={handleToggleVisibility}
                            onDelete={(selected) => {
                                setNotice(null)
                                setWorkToDelete(selected)
                            }}
                        />
                    ))}
                </div>
            )}

            <WorksPagination page={page} pageCount={pageCount} search={search} />

            <AlertDialog
                open={workToDelete !== null}
                onOpenChange={(open) => !open && setWorkToDelete(null)}
            >
                <AlertDialogContent className="admin-theme font-secondary text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć pracę?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Praca {deleteTitle} zostanie trwale usunięta z portfolio wraz z
                            przypisanymi zdjęciami.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isPending}
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
