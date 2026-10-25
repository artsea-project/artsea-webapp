"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { deleteLink } from "@/app/admin/profile/actions"
import LinkRow from "@/components/admin-profile/LinkRow"
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
import type { ProfileLink } from "@/lib/profile/queries"

interface LinksSectionProps {
    links: ProfileLink[]
}

export default function LinksSection({ links }: LinksSectionProps) {
    const [message, setMessage] = useState("")
    const [linkToDelete, setLinkToDelete] = useState<ProfileLink | null>(null)
    const [, startDeleting] = useTransition()

    function confirmDelete() {
        if (!linkToDelete) return

        const { linkId } = linkToDelete
        startDeleting(async () => {
            await deleteLink(linkId)
            setMessage("Usunięto link.")
        })
    }

    return (
        <section className="flex flex-col gap-4">
            <div>
                <h3 className="text-base font-bold text-foreground">Linki społecznościowe</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Dodaj linki, aby odwiedzający Twoje portfolio mogli Cię znaleźć w sieci.
                </p>
            </div>

            {links.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {links.map((link) => (
                        <LinkRow
                            key={link.linkId}
                            link={link}
                            onEdit={() => {}}
                            onDelete={() => setLinkToDelete(link)}
                        />
                    ))}
                </ul>
            )}

            <Button
                type="button"
                variant="outline"
                className="w-full border-dashed text-muted-foreground"
            >
                <Plus />
                Dodaj kolejny link
            </Button>

            <p role="status" className="text-sm text-muted-foreground">
                {message}
            </p>

            <AlertDialog
                open={linkToDelete !== null}
                onOpenChange={(open) => !open && setLinkToDelete(null)}
            >
                <AlertDialogContent className="admin-theme font-secondary text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć link?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Link {linkToDelete?.name} zniknie z portfolio.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmDelete}>
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}
