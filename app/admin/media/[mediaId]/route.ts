import { eq } from "drizzle-orm"

import { db } from "@/db"
import { media } from "@/db/schema"
import { serveMedia } from "@/lib/media"

async function loadAdminMediaMetadata(mediaId: string) {
    const [metadata] = await db
        .select({
            contentHash: media.contentHash,
            fileType: media.fileType,
        })
        .from(media)
        .where(eq(media.mediaId, mediaId))

    return metadata
}

async function loadAdminMediaRecord(mediaId: string) {
    const [record] = await db
        .select({
            content: media.content,
            contentHash: media.contentHash,
            fileType: media.fileType,
        })
        .from(media)
        .where(eq(media.mediaId, mediaId))

    return record
}

export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
    const { mediaId } = await params
    return serveMedia(request, mediaId, loadAdminMediaMetadata, loadAdminMediaRecord)
}
