import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { Image as ImageIcon, Ruler } from "lucide-react"
import parse from "html-react-parser"

interface PageProps {
    params: Promise<{ id: string }>
}

function parseTechnika(value: unknown): string {
    if (!value || typeof value !== "object") return ""
    const obj = value as Record<string, unknown>
    return typeof obj.technique === "string" ? obj.technique : ""
}

function parseOpis(value: unknown): string {
    if (!value || typeof value !== "object") return ""
    const obj = value as Record<string, unknown>
    return typeof obj.description === "string" ? obj.description : ""
}

function CarouselPlaceholder() {
    return (
        <div className="md:col-span-7">
            <div className="bg-stone-200/50 rounded-lg p-20 text-center text-stone-400 border border-dashed border-stone-300 flex flex-col items-center justify-center min-h-[400px]">
                <ImageIcon className="w-12 h-12 text-stone-300 mb-4 stroke-[1.5]" />
                <span className="text-xs uppercase tracking-widest font-secondary font-medium text-stone-400">
                    Miejsce na karuzelę zdjęć
                </span>
            </div>
        </div>
    )
}

interface ArtworkHeaderProps {
    title: string | null
    categoryName: string | null
    yearOfExecution: number | null
    tags: string[]
}

function ArtworkHeader({ title, categoryName, yearOfExecution, tags }: ArtworkHeaderProps) {
    return (
        <div>
            <div className="flex items-center gap-6 text-[11px] uppercase tracking-widest text-stone-400 dark:text-zinc-500 font-secondary font-bold">
                <span>{categoryName || "Bez kategorii"}</span>
                {yearOfExecution && (
                    <>
                        <span className="text-stone-300 dark:text-zinc-700"></span>
                        <span>{yearOfExecution}</span>
                    </>
                )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight font-primary mt-2">
                {title || "Bez tytułu"}
            </h1>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tagText, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-zinc-400 px-3 py-1 rounded-full border border-stone-300 dark:border-zinc-800"
                        >
                            <span className="text-stone-400">#</span>
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
        return <hr className="border-stone-200 dark:border-zinc-800" />
    }
    return (
        <div className="flex flex-col">
            <hr className="border-stone-200 dark:border-zinc-800" />
            <div className="flex items-center gap-2 text-stone-600 dark:text-zinc-400 text-sm font-secondary py-4">
                <Ruler className="w-4 h-4 text-stone-400 dark:text-zinc-500 stroke-[1.5]" />
                <span>{dimensions}</span>
            </div>
            <hr className="border-stone-200 dark:border-zinc-800" />
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
            <span className="text-[11px] font-bold tracking-widest text-stone-400 dark:text-zinc-500 uppercase font-secondary">
                {label}
            </span>
            <div className="text-stone-600 dark:text-zinc-300 leading-relaxed text-base font-body">
                {parse(content)}
            </div>
        </div>
    )
}

interface NextArtworkNavigationProps {
    nextArtwork: {
        artPieceId: string
        titlePln: string | null
    } | null
}

function NextArtworkNavigation({ nextArtwork }: NextArtworkNavigationProps) {
    if (!nextArtwork) return null
    return (
        <div className="mt-24 pt-12 border-t border-stone-200 dark:border-zinc-800">
            <Link
                href={`/work/${nextArtwork.artPieceId}`}
                className="group flex items-center justify-between gap-8 py-4 hover:opacity-90 transition-opacity"
            >
                <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold tracking-widest text-[#a8a29e] dark:text-[#78716c] uppercase font-secondary">
                        Zobacz kolejny
                    </span>
                    <span className="text-3xl md:text-5xl font-normal font-primary text-stone-950 dark:text-stone-50 transition-colors">
                        {nextArtwork.titlePln || "Bez tytułu"}
                    </span>
                </div>
                <div className="flex items-center">
                    <svg
                        viewBox="0 0 70 24"
                        className="w-16 h-6 stroke-[1.5] text-stone-950 dark:text-stone-50"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path d="M0 12H60" strokeLinecap="round" />
                        <path d="M50 2L60 12L50 22" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </Link>
        </div>
    )
}

export default async function WorkPage({ params }: PageProps) {
    const { id } = await params

    let artPiece = null

    try {
        artPiece = await db.query.artPieces.findFirst({
            where: (fields, { eq }) => eq(fields.artPieceId, id),
            with: {
                category: true,
                tags: {
                    with: {
                        tag: true,
                    },
                },
            },
        })
    } catch (error) {
        console.error("Database query failed:", error)
    }

    if (!artPiece) {
        notFound()
    }

    let allArtworks: { artPieceId: string; titlePln: string | null }[] = []
    try {
        allArtworks = await db.query.artPieces.findMany({
            columns: {
                artPieceId: true,
                titlePln: true,
            },
            where: (fields, { eq }) => eq(fields.isVisible, true),
            orderBy: (fields, { asc }) => asc(fields.artPieceId),
        })
    } catch (error) {
        console.error("Failed to fetch all artworks:", error)
    }

    const currentIndex = allArtworks.findIndex((a) => a.artPieceId === id)
    const nextArtwork =
        currentIndex !== -1 && allArtworks.length > 1
            ? allArtworks[(currentIndex + 1) % allArtworks.length]
            : null

    const title = artPiece.titlePln
    const categoryName = artPiece.category?.namePln

    const technikaPln = parseTechnika(artPiece.descriptionPln)
    const opisPln = parseOpis(artPiece.descriptionPln)

    const tagsList = artPiece.tags
        .map((t) => t.tag?.namePln)
        .filter((name): name is string => typeof name === "string")

    return (
        <div className="min-h-screen bg-background text-foreground font-body transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-6 py-8 md:px-16 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
                    <CarouselPlaceholder />
                    <div className="md:col-span-5 md:sticky md:top-24 flex flex-col gap-8">
                        <ArtworkHeader
                            title={title}
                            categoryName={categoryName}
                            yearOfExecution={artPiece.yearOfExecution}
                            tags={tagsList}
                        />
                        <DimensionsSection dimensions={artPiece.dimensions} />
                        <DetailSection label="Technika i materiały" content={technikaPln} />
                        <DetailSection label="O projekcie" content={opisPln} />
                    </div>
                </div>
                <NextArtworkNavigation nextArtwork={nextArtwork} />
            </div>
        </div>
    )
}
