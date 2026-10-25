import { db } from "@/db"
import { profileImageResponse } from "@/lib/profile/image"

async function loadStoredImage() {
    const profile = await db.query.profiles.findFirst({
        columns: { profileImageContentHash: true, profileImageFileType: true },
    })

    if (!profile?.profileImageContentHash || !profile.profileImageFileType) return null

    return { contentHash: profile.profileImageContentHash, fileType: profile.profileImageFileType }
}

async function loadImageContent() {
    const profile = await db.query.profiles.findFirst({
        columns: { profileImageContent: true },
    })

    return profile?.profileImageContent ?? null
}

export async function GET(request: Request, { params }: { params: Promise<{ hash: string }> }) {
    const { hash } = await params

    return profileImageResponse({
        requestedHash: hash,
        ifNoneMatch: request.headers.get("if-none-match"),
        stored: await loadStoredImage(),
        loadContent: loadImageContent,
    })
}
