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

const CHOICE_CLASS =
    "w-full rounded-lg border border-border bg-background p-2 transition-colors hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

function Thumbnail({ mediaId, alt }: { mediaId: string; alt: string }) {
    return (
        <span className="relative block aspect-square w-full overflow-hidden rounded-md bg-muted">
            <Image {...bentoImageProps(mediaId, "160px")} alt={alt} className="object-cover" />
        </span>
    )
}

function ArtworkChoices({
    artworks,
    onChoose,
}: {
    artworks: PickerArtwork[]
    onChoose: (artwork: PickerArtwork) => void
}) {
    if (artworks.length === 0) {
        return <p className="text-sm text-muted-foreground">Brak widocznych prac ze zdjęciami.</p>
    }

    return (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {artworks.map((artwork) => (
                <li key={artwork.artPieceId}>
                    <button
                        type="button"
                        className={`flex h-full flex-col gap-2 text-left text-sm ${CHOICE_CLASS}`}
                        onClick={() => onChoose(artwork)}
                    >
                        <Thumbnail mediaId={artwork.mediaIds[0]} alt="" />
                        <span className="line-clamp-2">{artwork.title ?? "Bez tytułu"}</span>
                    </button>
                </li>
            ))}
        </ul>
    )
}

function ImageChoices({
    artwork,
    onBack,
    onPick,
}: {
    artwork: PickerArtwork
    onBack: () => void
    onPick: (mediaId: string) => void
}) {
    return (
        <div className="flex flex-col gap-4">
            <Button type="button" variant="ghost" className="w-fit" onClick={onBack}>
                <ArrowLeft aria-hidden />
                Wróć do listy prac
            </Button>
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                {artwork.mediaIds.map((mediaId, index) => (
                    <li key={mediaId}>
                        <button
                            type="button"
                            className={CHOICE_CLASS}
                            onClick={() => onPick(mediaId)}
                        >
                            <Thumbnail mediaId={mediaId} alt={`Zdjęcie ${index + 1}`} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

type ArtworkPickerDialogProps = {
    open: boolean
    title: string
    artworks: PickerArtwork[]
    onOpenChange: (open: boolean) => void
    onPick: (content: TileContent) => void
}

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
                    <ImageChoices
                        artwork={artwork}
                        onBack={() => setArtwork(null)}
                        onPick={(mediaId) => {
                            onPick({ artPieceId: artwork.artPieceId, mediaId })
                            changeOpen(false)
                        }}
                    />
                ) : (
                    <ArtworkChoices artworks={artworks} onChoose={setArtwork} />
                )}
            </DialogContent>
        </Dialog>
    )
}
