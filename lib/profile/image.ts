import { NextResponse } from "next/server"

import { mediaHeaders } from "@/lib/media"
import type { ProfileImageType } from "@/lib/profile/validation"

const HASH_PATTERN = /^[0-9a-f]{64}$/

export type ProfileImageMetadata = {
    contentHash: string
    fileType: ProfileImageType
}

type ProfileImageRequest = {
    requestedHash: string
    ifNoneMatch: string | null
    stored: ProfileImageMetadata | null
    loadContent: () => Promise<Buffer | null>
}

export function profileImagePath(hash: string): string {
    return `/profile-image/${hash}`
}

export function isProfileImageHash(value: string): boolean {
    return HASH_PATTERN.test(value)
}

function notFound() {
    return new NextResponse(null, { status: 404 })
}

export async function profileImageResponse({
    requestedHash,
    ifNoneMatch,
    stored,
    loadContent,
}: ProfileImageRequest): Promise<NextResponse> {
    if (!isProfileImageHash(requestedHash) || stored?.contentHash !== requestedHash) {
        return notFound()
    }

    if (ifNoneMatch === `"${stored.contentHash}"`) {
        return new NextResponse(null, { status: 304, headers: mediaHeaders(stored) })
    }

    const content = await loadContent()
    if (!content) return notFound()

    return new NextResponse(new Uint8Array(content), {
        headers: mediaHeaders({ ...stored, content }),
    })
}
