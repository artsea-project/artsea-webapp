import { notFound } from "next/navigation"
import { db } from "@/db"
import { Image as ImageIcon } from "lucide-react"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function WorkPage({ params }: PageProps) {
    const { id } = await params

    let artPiece = null

    try {
        artPiece = await db.query.artPieces.findFirst({
            where: (fields, { eq }) => eq(fields.artPieceId, id),
            with: {
                category: true,
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
                    <div className="md:col-span-5 md:sticky md:top-24 flex flex-col gap-6">
                        {/* Header metadata: Category - Year */}
                        <div>
                            <div className="text-xs uppercase tracking-widest text-stone-400 font-secondary font-medium">
                                {categoryName || "Bez kategorii"}
                                {artPiece.yearOfExecution && ` - ${artPiece.yearOfExecution}`}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight font-primary mt-2">
                                {title || "Bez tytułu"}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
