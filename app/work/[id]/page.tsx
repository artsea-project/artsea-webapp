import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { Image as ImageIcon, Ruler } from "lucide-react"
import parse from "html-react-parser"

interface PageProps {
    params: Promise<{ id: string }>
}

// Safely parses JSONB fields (like descriptions) into paragraphs
function parseJsonbText(value: unknown): string[] {
    if (!value) return []
    if (typeof value === "string") return [value]
    if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>
        if (Array.isArray(obj.paragraphs)) {
            return obj.paragraphs.map(String)
        }
        if (Array.isArray(obj.blocks)) {
            return obj.blocks
                .map((block: unknown) => {
                    if (block && typeof block === "object") {
                        const b = block as Record<string, unknown>
                        if (b.type === "paragraph" && b.data && typeof b.data === "object") {
                            const data = b.data as Record<string, unknown>
                            return String(data.text || "")
                        }
                    }
                    return ""
                })
                .filter(Boolean)
        }
        if (typeof obj.text === "string") {
            return [obj.text]
        }
    }
    return []
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

    // Query all visible artworks to determine the next artwork in sequence
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

    // Parse Polish description paragraphs
    const descriptionParagraphs = parseJsonbText(artPiece.descriptionPln)

    // Parse Polish tag names
    const tagsList = artPiece.tags
        .map((t) => t.tag?.namePln)
        .filter((name): name is string => typeof name === "string")

    return (
        <div className="min-h-screen bg-background text-foreground font-body transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-6 py-8 md:px-16 md:py-12">
                {/* Main Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
                    {/* Left Column: Carousel Placeholder */}
                    <div className="md:col-span-7">
                        <div className="bg-stone-200/50 rounded-lg p-20 text-center text-stone-400 border border-dashed border-stone-300 flex flex-col items-center justify-center min-h-[400px]">
                            <ImageIcon className="w-12 h-12 text-stone-300 mb-4 stroke-[1.5]" />
                            <span className="text-xs uppercase tracking-widest font-secondary font-medium text-stone-400">
                                Miejsce na karuzelę zdjęć
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Sticky Text details */}
                    <div className="md:col-span-5 md:sticky md:top-24 flex flex-col gap-8">
                        {/* Header metadata: Category - Year */}
                        <div>
                            <div className="flex items-center gap-6 text-[11px] uppercase tracking-widest text-stone-400 dark:text-zinc-500 font-secondary font-bold">
                                <span>{categoryName || "Bez kategorii"}</span>
                                {artPiece.yearOfExecution && (
                                    <>
                                        <span className="text-stone-300 dark:text-zinc-700">—</span>
                                        <span>{artPiece.yearOfExecution}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight font-primary mt-2">
                                {title || "Bez tytułu"}
                            </h1>

                            {/* Tags list section */}
                            {tagsList.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {tagsList.map((tagText, idx) => (
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

                        {/* Separating Line & Dimensions */}
                        {artPiece.dimensions ? (
                            <div className="flex flex-col">
                                <hr className="border-stone-200 dark:border-zinc-800" />
                                <div className="flex items-center gap-2 text-stone-600 dark:text-zinc-400 text-sm font-secondary py-4">
                                    {/*<Ruler className="w-4 h-4 text-stone-400 dark:text-zinc-500 stroke-[1.5]" />*/}
                                    <span>{artPiece.dimensions}</span>
                                </div>
                                <hr className="border-stone-200 dark:border-zinc-800" />
                            </div>
                        ) : (
                            <hr className="border-stone-200 dark:border-zinc-800" />
                        )}

                        {/* Description Content */}
                        {descriptionParagraphs.length > 0 && (
                            <div className="flex flex-col gap-4 text-stone-600 dark:text-zinc-300 leading-relaxed text-base font-body">
                                {descriptionParagraphs.map((para, idx) => (
                                    <p key={idx}>{parse(para)}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Next Artwork Navigation */}
                {nextArtwork && (
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
                                {/* Custom arrow matched to Figma bounding boxes (60px tail, 20px head height, 10px head depth) */}
                                <svg
                                    viewBox="0 0 70 24"
                                    className="w-16 h-6 stroke-[1.5] text-stone-950 dark:text-stone-50"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path d="M0 12H60" strokeLinecap="round" />
                                    <path
                                        d="M50 2L60 12L50 22"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
