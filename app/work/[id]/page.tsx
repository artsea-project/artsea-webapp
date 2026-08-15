import { notFound } from "next/navigation"
import { db } from "@/db"
import { Image as ImageIcon } from "lucide-react"

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

    const title = artPiece.titlePln
    const categoryName = artPiece.category?.namePln

    // Parse Polish description paragraphs
    const descriptionParagraphs = parseJsonbText(artPiece.descriptionPln)

    // Parse Polish tag names
    const tagsList = artPiece.tags
        .map((t) => t.tag?.namePln)
        .filter((name): name is string => typeof name === "string")

    return (
        <div className="min-h-screen bg-stone-50 text-stone-900 font-body transition-colors duration-200">
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
                            <div className="text-xs uppercase tracking-widest text-stone-400 font-secondary font-medium">
                                {categoryName || "Bez kategorii"}
                                {artPiece.yearOfExecution && ` - ${artPiece.yearOfExecution}`}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight font-primary mt-2">
                                {title || "Bez tytułu"}
                            </h1>

                            {/* Tags list rendered directly below title */}
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

                        {/* Separating Line */}
                        <hr className="border-stone-200 dark:border-zinc-800" />

                        {/* Description Content */}
                        {descriptionParagraphs.length > 0 ? (
                            <div className="flex flex-col gap-4 text-stone-600 leading-relaxed text-base font-body">
                                {descriptionParagraphs.map((para, idx) => (
                                    <p key={idx}>{para}</p>
                                ))}
                            </div>
                        ) : (
                            !!artPiece.miniDescriptionPln && (
                                <div className="text-stone-600 italic text-base">
                                    {parseJsonbText(artPiece.descriptionPln).map((para, idx) => (
                                        <p key={idx}>{para}</p>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
