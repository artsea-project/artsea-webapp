import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { artPieces, media } from "@/db/schema";
import { isMediaType, mediaHeaders } from "@/lib/media";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function notFound() {
  return new NextResponse(null, { status: 404 });
}

export function mediaResponse(record: {
  content: Buffer;
  contentHash: string;
  fileType: string;
}) {
  if (!isMediaType(record.fileType)) {
    return notFound();
  }

  return new NextResponse(new Uint8Array(record.content), {
    headers: mediaHeaders({ ...record, fileType: record.fileType }),
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await params;

  if (!UUID_PATTERN.test(mediaId)) {
    return notFound();
  }

  const [record] = await db
    .select({
      content: media.content,
      contentHash: media.contentHash,
      fileType: media.fileType,
    })
    .from(media)
    .innerJoin(artPieces, eq(media.artPieceId, artPieces.artPieceId))
    .where(and(eq(media.mediaId, mediaId), eq(artPieces.isVisible, true)));

  return record ? mediaResponse(record) : notFound();
}
