"use client"

import { useState } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"

const Lightbox = dynamic(() => import("./ProjectGalleryLightbox"), { ssr: false })

export interface GalleryPhoto {
    src: string
    alt?: string
    mediaId?: string
    orderIndex?: number
}

export interface ProjectGalleryProps {
    photos: GalleryPhoto[]
    title?: string
}

interface ThumbnailProps {
    photo: GalleryPhoto
    alt: string
    onClick: () => void
    aspectRatio?: string
    widthClass?: string
    children?: React.ReactNode
}

function GalleryThumbnail({
    photo,
    alt,
    onClick,
    aspectRatio = "aspect-[4/3]",
    widthClass = "w-full",
    children,
}: ThumbnailProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative ${widthClass} ${aspectRatio} overflow-hidden bg-stone-100 dark:bg-zinc-900 cursor-pointer hover:opacity-95 transition-opacity text-left p-0 border-0`}
        >
            <Image
                src={photo.src}
                alt={alt}
                fill
                sizes="(max-width: 768px) 50vw, 30vw"
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {children}
        </button>
    )
}

interface LayoutProps {
    photos: GalleryPhoto[]
    title?: string
    onSelect: (index: number) => void
}

function GalleryMainPhoto({
    photo,
    title,
    onClick,
}: {
    photo: GalleryPhoto
    title?: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative w-full aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-zinc-900 cursor-pointer hover:opacity-95 transition-opacity text-left p-0 border-0"
        >
            <Image
                src={photo.src}
                alt={photo.alt || title || "Main artwork photo"}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
        </button>
    )
}

function TwoPhotosLayout({ photos, title, onSelect }: LayoutProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} title={title} onClick={() => onSelect(0)} />
            <GalleryThumbnail
                photo={photos[1]}
                alt={photos[1].alt || `${title || "Artwork"} - photo 2`}
                onClick={() => onSelect(1)}
                widthClass="w-1/2"
            />
        </div>
    )
}

function ThreePhotosLayout({ photos, title, onSelect }: LayoutProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} title={title} onClick={() => onSelect(0)} />
            <div className="grid grid-cols-2 gap-4">
                {photos.slice(1, 3).map((photo, i) => (
                    <GalleryThumbnail
                        key={photo.mediaId || i}
                        photo={photo}
                        alt={photo.alt || `${title || "Artwork"} - photo ${i + 2}`}
                        onClick={() => onSelect(i + 1)}
                    />
                ))}
            </div>
        </div>
    )
}

function FourPhotosLayout({ photos, title, onSelect }: LayoutProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} title={title} onClick={() => onSelect(0)} />
            <div className="grid grid-cols-3 gap-4">
                {photos.slice(1, 4).map((photo, i) => (
                    <GalleryThumbnail
                        key={photo.mediaId || i}
                        photo={photo}
                        alt={photo.alt || `${title || "Artwork"} - photo ${i + 2}`}
                        onClick={() => onSelect(i + 1)}
                    />
                ))}
            </div>
        </div>
    )
}

function MoreThanFourPhotosLayout({ photos, title, onSelect }: LayoutProps) {
    const remaining = photos.length - 4
    const remainingLabel = `+${remaining} ${remaining === 1 ? "photo" : "photos"}`

    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} title={title} onClick={() => onSelect(0)} />
            <div className="grid grid-cols-3 gap-4">
                <GalleryThumbnail
                    photo={photos[1]}
                    alt={photos[1].alt || `${title || "Artwork"} - photo 2`}
                    onClick={() => onSelect(1)}
                />
                <GalleryThumbnail
                    photo={photos[2]}
                    alt={photos[2].alt || `${title || "Artwork"} - photo 3`}
                    onClick={() => onSelect(2)}
                />
                <GalleryThumbnail
                    photo={photos[3]}
                    alt={photos[3].alt || `${title || "Artwork"} - photo 4`}
                    onClick={() => onSelect(3)}
                >
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center transition-colors group-hover:bg-stone-900/70">
                        <span className="text-white font-secondary font-medium text-sm md:text-base tracking-wide">
                            {remainingLabel}
                        </span>
                    </div>
                </GalleryThumbnail>
            </div>
        </div>
    )
}

function GalleryPreview({ photos, title, onSelect }: LayoutProps) {
    const total = photos.length

    if (total === 1) {
        return <GalleryMainPhoto photo={photos[0]} title={title} onClick={() => onSelect(0)} />
    }
    if (total === 2) {
        return <TwoPhotosLayout photos={photos} title={title} onSelect={onSelect} />
    }
    if (total === 3) {
        return <ThreePhotosLayout photos={photos} title={title} onSelect={onSelect} />
    }
    if (total === 4) {
        return <FourPhotosLayout photos={photos} title={title} onSelect={onSelect} />
    }
    return <MoreThanFourPhotosLayout photos={photos} title={title} onSelect={onSelect} />
}

export function ProjectGallery({ photos, title }: ProjectGalleryProps) {
    const [index, setIndex] = useState(-1)

    if (!photos || photos.length === 0) {
        return null
    }

    const slides = photos.map((p, i) => ({
        src: p.src,
        alt: p.alt || (title ? `${title} - photo ${i + 1}` : `Photo ${i + 1}`),
    }))

    return (
        <div className="w-full">
            <GalleryPreview photos={photos} title={title} onSelect={setIndex} />
            {index >= 0 && (
                <Lightbox
                    open={index >= 0}
                    index={index}
                    close={() => setIndex(-1)}
                    slides={slides}
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
