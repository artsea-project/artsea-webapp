import { notFound } from "next/navigation"
import { db } from "@/db"

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

    return (
        <div className="p-8 font-mono max-w-2xl mx-auto">
            <pre className="p-4 bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded text-xs overflow-auto">
                {JSON.stringify(artPiece, null, 2)}
            </pre>
        </div>
    )
}
