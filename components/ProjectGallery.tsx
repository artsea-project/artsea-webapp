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
    aspectRatio?: string
    widthClass?: string
    children?: React.ReactNode
}

function GalleryThumbnail({
    photo,
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
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 50vw, 30vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {children}
        </button>
    )
}

interface LayoutProps {
    photos: GalleryPhoto[]
    onSelect: (index: number) => void
}

function GalleryMainPhoto({ photo, onClick }: { photo: GalleryPhoto; onClick: () => void }) {
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
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
                className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
        </button>
    )
}

function TwoPhotosLayout({ photos, onSelect }: LayoutProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} onClick={() => onSelect(0)} />
            <GalleryThumbnail photo={photos[1]} onClick={() => onSelect(1)} widthClass="w-1/2" />
        </div>
    )
}

function ThreePhotosLayout({ photos, onSelect }: LayoutProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} onClick={() => onSelect(0)} />
            <div className="grid grid-cols-2 gap-4">
                {photos.slice(1, 3).map((photo, i) => (
                    <GalleryThumbnail
                        key={photo.src}
                        photo={photo}
                        onClick={() => onSelect(i + 1)}
                    />
                ))}
            </div>
        </div>
    )
}

function FourPhotosLayout({ photos, onSelect }: LayoutProps) {
    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} onClick={() => onSelect(0)} />
            <div className="grid grid-cols-3 gap-4">
                {photos.slice(1, 4).map((photo, i) => (
                    <GalleryThumbnail
                        key={photo.src}
                        photo={photo}
                        onClick={() => onSelect(i + 1)}
                    />
                ))}
            </div>
        </div>
    )
}

function MoreThanFourPhotosLayout({ photos, onSelect }: LayoutProps) {
    const remaining = photos.length - 4
    const remainingLabel = `+${remaining} ${remaining === 1 ? "photo" : "photos"}`

    return (
        <div className="flex flex-col gap-4 w-full">
            <GalleryMainPhoto photo={photos[0]} onClick={() => onSelect(0)} />
            <div className="grid grid-cols-3 gap-4">
                <GalleryThumbnail photo={photos[1]} onClick={() => onSelect(1)} />
                <GalleryThumbnail photo={photos[2]} onClick={() => onSelect(2)} />
                <GalleryThumbnail photo={photos[3]} onClick={() => onSelect(3)}>
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

function GalleryPreview({ photos, onSelect }: LayoutProps) {
    const total = photos.length

    if (total === 1) {
        return <GalleryMainPhoto photo={photos[0]} onClick={() => onSelect(0)} />
    }
    if (total === 2) {
        return <TwoPhotosLayout photos={photos} onSelect={onSelect} />
    }
    if (total === 3) {
        return <ThreePhotosLayout photos={photos} onSelect={onSelect} />
    }
    if (total === 4) {
        return <FourPhotosLayout photos={photos} onSelect={onSelect} />
    }
    return <MoreThanFourPhotosLayout photos={photos} onSelect={onSelect} />
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
