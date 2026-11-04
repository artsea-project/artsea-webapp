"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

import { bentoImageProps } from "@/components/bento/bento-card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { TileContent } from "@/lib/appearance/bento-editor-state"
import type { PickerArtwork } from "@/lib/appearance/queries"

type ArtworkPickerDialogProps = {
    open: boolean
    title: string
    artworks: PickerArtwork[]
    onOpenChange: (open: boolean) => void
    onPick: (content: TileContent) => void
}

/** A framed choice, so a photo and its title read as one item; the frame lights up on hover. */
const CHOICE_CLASS =
    "w-full rounded-lg border border-border bg-background p-2 transition-colors hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

function Thumbnail({ mediaId, alt }: { mediaId: string; alt: string }) {
    return (
        <span className="relative block aspect-square w-full overflow-hidden rounded-md bg-muted">
            <Image {...bentoImageProps(mediaId, "160px")} alt={alt} className="object-cover" />
        </span>
    )
}

/** Two steps: pick a work, then one of its images. Only works visible on the site are listed. */
export function ArtworkPickerDialog({
    open,
    title,
    artworks,
    onOpenChange,
    onPick,
}: ArtworkPickerDialogProps) {
    const [artwork, setArtwork] = useState<PickerArtwork | null>(null)

    function changeOpen(next: boolean) {
        if (!next) setArtwork(null)
        onOpenChange(next)
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogContent className="admin-theme max-h-[85vh] overflow-y-auto font-secondary text-foreground sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {artwork
                            ? `Wybierz zdjęcie pracy "${artwork.title ?? "Bez tytułu"}".`
                            : "Wybierz pracę. Lista zawiera tylko prace widoczne na stronie."}
                    </DialogDescription>
                </DialogHeader>

                {artwork ? (
                    <div className="flex flex-col gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-fit"
                            onClick={() => setArtwork(null)}
                        >
                            <ArrowLeft aria-hidden />
                            Wróć do listy prac
                        </Button>
                        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                            {artwork.mediaIds.map((mediaId, index) => (
                                <li key={mediaId}>
                                    <button
                                        type="button"
                                        className={CHOICE_CLASS}
                                        onClick={() => {
                                            onPick({ artPieceId: artwork.artPieceId, mediaId })
                                            changeOpen(false)
                                        }}
                                    >
                                        <Thumbnail mediaId={mediaId} alt={`Zdjęcie ${index + 1}`} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : artworks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Brak widocznych prac ze zdjęciami.
                    </p>
                ) : (
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {artworks.map((item) => (
                            <li key={item.artPieceId}>
                                <button
                                    type="button"
                                    className={`flex h-full flex-col gap-2 text-left text-sm ${CHOICE_CLASS}`}
                                    onClick={() => setArtwork(item)}
                                >
                                    <Thumbnail
                                        mediaId={item.mediaIds[0]}
                                        alt={item.title ?? "Bez tytułu"}
                                    />
                                    <span className="line-clamp-2">
                                        {item.title ?? "Bez tytułu"}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    )
}
