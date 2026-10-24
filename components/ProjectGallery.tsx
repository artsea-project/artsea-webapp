"use client"

import { useState } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"

const Lightbox = dynamic(() => import("./ProjectGalleryLightbox"), { ssr: false })

export interface GalleryPhoto {
    src: string
    alt: string
}

export interface ProjectGalleryProps {
    photos: GalleryPhoto[]
}

interface ThumbnailProps {
    photo: GalleryPhoto
    onClick: () => void
    children?: React.ReactNode
}

function GalleryThumbnail({ photo, onClick, children }: ThumbnailProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative w-full aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-zinc-900 cursor-pointer hover:opacity-95 transition-opacity text-left p-0 border-0"
        >
            <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 50vw, 30vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
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
            <Image
                src={photo.src}
                alt={photo.alt}
                width={0}
                height={0}
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
                className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.01]"
            />
        </button>
    )
}

interface LayoutProps {
    photos: GalleryPhoto[]
    onSelect: (index: number) => void
}

function GalleryPreview({ photos, onSelect }: LayoutProps) {
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
                        const remainingLabel = `+${remaining} ${remaining === 1 ? "photo" : "photos"}`

                        return (
                            <GalleryThumbnail
                                key={photo.src}
                                photo={photo}
                                onClick={() => onSelect(i + 1)}
                            >
                                {isLastWithRemaining && (
                                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center transition-colors group-hover:bg-stone-900/70">
                                        <span className="text-white font-secondary font-medium text-sm md:text-base tracking-wide">
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

export function ProjectGallery({ photos }: ProjectGalleryProps) {
    const [index, setIndex] = useState(-1)

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
                    slides={photos}
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
