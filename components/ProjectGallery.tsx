"use client"

import { useState } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Play } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Slide } from "yet-another-react-lightbox"
import type { MediaType } from "@/lib/media"
import { cn } from "@/lib/utils"

const Lightbox = dynamic(() => import("./ProjectGalleryLightbox"), { ssr: false })

export interface GalleryPhoto {
    src: string
    alt: string
    fileType: MediaType
}

export interface ProjectGalleryProps {
    photos: GalleryPhoto[]
}

interface ThumbnailProps {
    photo: GalleryPhoto
    onClick: () => void
    hidePlayBadge?: boolean
    children?: React.ReactNode
}

function GalleryMedia({
    photo,
    variant,
    hidePlayBadge = false,
}: {
    photo: GalleryPhoto
    variant: "main" | "thumbnail"
    hidePlayBadge?: boolean
}) {
    const mediaClassName = cn(
        "transition-transform duration-300 group-hover:scale-[1.01]",
        variant === "main" ? "w-full h-auto" : "h-full w-full object-cover",
        photo.fileType === "mp4" && "pointer-events-none"
    )

    if (photo.fileType === "mp4") {
        return (
            <>
                <video
                    src={`${photo.src}#t=0.001`}
                    preload="metadata"
                    muted
                    playsInline
                    aria-label={photo.alt}
                    className={mediaClassName}
                />
                {!hidePlayBadge && (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/60 text-background backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-105">
                            <Play className="h-5 w-5 fill-current translate-x-0.5" />
                        </span>
                    </span>
                )}
            </>
        )
    }

    if (variant === "main") {
        return (
            <Image
                src={photo.src}
                alt={photo.alt}
                width={0}
                height={0}
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
                className={mediaClassName}
            />
        )
    }

    return (
        <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 768px) 50vw, 30vw"
            className={mediaClassName}
        />
    )
}

function GalleryThumbnail({ photo, onClick, hidePlayBadge, children }: ThumbnailProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative w-full aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-zinc-900 cursor-pointer hover:opacity-95 transition-opacity text-left p-0 border-0"
        >
            <GalleryMedia photo={photo} variant="thumbnail" hidePlayBadge={hidePlayBadge} />
            {children}
        </button>
    )
}

function GalleryMainPhoto({ photo, onClick }: { photo: GalleryPhoto; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative w-full overflow-hidden bg-stone-100 dark:bg-zinc-900 cursor-pointer hover:opacity-95 transition-opacity text-left p-0 border-0"
        >
            <GalleryMedia photo={photo} variant="main" />
        </button>
    )
}

interface LayoutProps {
    photos: GalleryPhoto[]
    onSelect: (index: number) => void
}

function GalleryPreview({ photos, onSelect }: LayoutProps) {
    const t = useTranslations("Gallery")
    const thumbnails = photos.slice(1, 4)
    const remaining = photos.length - 4
    const gridColsClass = thumbnails.length <= 2 ? "grid-cols-2" : "grid-cols-3"

    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} onClick={() => onSelect(0)} />
            {thumbnails.length > 0 && (
                <div className={`grid ${gridColsClass} gap-4`}>
                    {thumbnails.map((photo, i) => {
                        const isLastWithRemaining = i === 2 && remaining > 0
                        const remainingLabel = t("moreItems", { count: remaining })

                        return (
                            <GalleryThumbnail
                                key={photo.src}
                                photo={photo}
                                hidePlayBadge={isLastWithRemaining}
                                onClick={() => onSelect(i + 1)}
                            >
                                {isLastWithRemaining && (
                                    <div className="absolute inset-0 bg-foreground/60 backdrop-blur-[2px] flex items-center justify-center transition-colors group-hover:bg-foreground/70">
                                        <span className="text-background font-secondary font-medium text-sm md:text-base tracking-wide">
                                            {remainingLabel}
                                        </span>
                                    </div>
                                )}
                            </GalleryThumbnail>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function toLightboxSlide(photo: GalleryPhoto): Slide {
    if (photo.fileType === "mp4") {
        return {
            type: "video",
            alt: photo.alt,
            sources: [{ src: photo.src, type: "video/mp4" }],
            controls: true,
            playsInline: true,
        }
    }
    return { src: photo.src, alt: photo.alt }
}

export function ProjectGallery({ photos }: ProjectGalleryProps) {
    const [index, setIndex] = useState(-1)
    const t = useTranslations("Gallery")

    if (!photos || photos.length === 0) {
        return null
    }

    return (
        <div className="w-full">
            <GalleryPreview photos={photos} onSelect={setIndex} />
            {index >= 0 && (
                <Lightbox
                    open={index >= 0}
                    index={index}
                    close={() => setIndex(-1)}
                    slides={photos.map(toLightboxSlide)}
                    labels={{
                        Previous: t("previous"),
                        Next: t("next"),
                        Close: t("close"),
                        Slide: t("slide"),
                        Carousel: t("carousel"),
                        Lightbox: t("lightbox"),
                        "Photo gallery": t("photoGallery"),
                        "{index} of {total}": t("slideCounter", {
                            index: "{index}",
                            total: "{total}",
                        }),
                    }}
                    controller={{ closeOnBackdropClick: true }}
                    carousel={{ padding: "48px" }}
                    styles={{
                        root: {
                            "--yarl__color_backdrop": "rgba(0, 0, 0, 0.6)",
                            backdropFilter: "blur(10px)",
                        },
                        slide: {
                            padding: "16px",
                        },
                    }}
                />
            )}
        </div>
    )
}
