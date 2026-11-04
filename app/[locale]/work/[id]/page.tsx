import { Suspense } from "react"
import { notFound } from "next/navigation"
import { useTranslations } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"
import { Ruler, MoveRight } from "lucide-react"
import parse from "html-react-parser"
import { ProjectGallery } from "@/components/ProjectGallery"
import { Link } from "@/i18n/navigation"
import {
    getArtworkDetails,
    getNextArtwork,
    type ArtworkDetails,
    type ArtworkLink,
} from "@/lib/artworks/queries"

interface PageProps {
    params: Promise<{ id: string }>
}

interface ArtworkHeaderProps {
    title: string
    categoryName: string
    yearOfExecution: number | null
    tags: string[]
}

function ArtworkHeader({ title, categoryName, yearOfExecution, tags }: ArtworkHeaderProps) {
    return (
        <div>
            <div className="flex items-center gap-6 text-[11px] uppercase tracking-widest text-muted-foreground font-secondary font-bold">
                <span>{categoryName}</span>
                {yearOfExecution && (
                    <>
                        <span className="text-muted-foreground"></span>
                        <span>{yearOfExecution}</span>
                    </>
                )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight font-primary mt-2">{title}</h1>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tagText, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs text-foreground px-3 py-1 rounded-full border border-border"
                        >
                            <span className="text-muted-foreground">#</span>
                            {tagText}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

interface DimensionsSectionProps {
    dimensions: string | null
}

function DimensionsSection({ dimensions }: DimensionsSectionProps) {
    if (!dimensions) {
        return <hr className="border-border" />
    }
    return (
        <div className="flex flex-col">
            <hr className="border-border" />
            <div className="flex items-center gap-2 text-foreground text-sm font-secondary py-4">
                <Ruler className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
                <span>{dimensions}</span>
            </div>
            <hr className="border-border" />
        </div>
    )
}

interface DetailSectionProps {
    label: string
    content: string
}

function DetailSection({ label, content }: DetailSectionProps) {
    if (!content) return null
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase font-secondary">
                {label}
            </span>
            <div className="text-foreground leading-relaxed text-base font-body">
                {parse(content)}
            </div>
        </div>
    )
}

interface NextArtworkNavigationProps {
    artPieceId: string
    title: string
}

function NextArtworkNavigation({ artPieceId, title }: NextArtworkNavigationProps) {
    const t = useTranslations("Artwork")

    return (
        <div className="mt-24 pt-12 border-t border-border">
            <Link
                href={`/work/${artPieceId}`}
                className="group flex items-center justify-between gap-8 py-4 hover:opacity-90 transition-opacity"
            >
                <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold tracking-widest text-primary uppercase font-secondary">
                        {t("next")}
                    </span>
                    <span className="text-3xl md:text-5xl font-normal font-primary text-foreground transition-colors">
                        {title}
                    </span>
                </div>
                <div className="flex items-center">
                    <MoveRight className="w-32 h-12 stroke-[1.5] text-foreground" />
                </div>
            </Link>
        </div>
    )
}

export default function WorkPage({ params }: PageProps) {
    return (
        <Suspense fallback={null}>
            <WorkDetails params={params} />
        </Suspense>
    )
}

async function loadArtwork(id: string): Promise<[ArtworkDetails | null, ArtworkLink | null]> {
    const locale = await getLocale()

    try {
        return await Promise.all([getArtworkDetails(id, locale), getNextArtwork(id, locale)])
    } catch (error) {
        console.error("Database query failed:", error)
        return [null, null]
    }
}

async function WorkDetails({ params }: PageProps) {
    const { id } = await params
    const [artwork, nextArtwork] = await loadArtwork(id)

    if (!artwork) {
        notFound()
    }

    const t = await getTranslations("Artwork")
    const title = artwork.title ?? t("untitled")

    const galleryPhotos = artwork.photos.map((photo) => ({
        src: `/media/${photo.mediaId}`,
        alt: t("photoAlt", { title, number: photo.orderIndex + 1 }),
    }))

    return (
        <div className="min-h-screen bg-background text-foreground font-body transition-colors duration-200">
            <div className="page-container py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
                    <div className="md:col-span-7 w-full">
                        <ProjectGallery photos={galleryPhotos} />
                    </div>
                    <div className="md:col-span-5 md:sticky md:top-24 flex flex-col gap-8">
                        <ArtworkHeader
                            title={title}
                            categoryName={artwork.categoryName}
                            yearOfExecution={artwork.yearOfExecution}
                            tags={artwork.tags}
                        />
                        <DimensionsSection dimensions={artwork.dimensions} />
                        <DetailSection label={t("technique")} content={artwork.technique} />
                        <DetailSection label={t("description")} content={artwork.description} />
                    </div>
                </div>
                {nextArtwork && (
                    <NextArtworkNavigation
                        artPieceId={nextArtwork.artPieceId}
                        title={nextArtwork.title ?? t("untitled")}
                    />
                )}
            </div>
        </div>
    )
}
