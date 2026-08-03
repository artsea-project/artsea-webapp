import { createHash, randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";

import { GET } from "../app/media/[mediaId]/route";
import { db } from "../db";
import { artPieces, categories, media, users } from "../db/schema";

const contentFor = {
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]),
  jpg: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  gif: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  mp4: Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]),
} as const;

type SupportedType = "png" | "jpg" | "gif";

const userId = randomUUID();
const categoryId = randomUUID();
const visibleArtworkId = randomUUID();
const hiddenArtworkId = randomUUID();
const mediaIdByType = new Map<string, string>();

async function requestMedia(mediaId: string, ifNoneMatch?: string) {
  return GET(new Request(`http://localhost/media/${mediaId}`, {
    headers: ifNoneMatch ? { "if-none-match": ifNoneMatch } : {},
  }), { params: Promise.resolve({ mediaId }) });
}

test.beforeAll(async () => {
  await db.insert(users).values({
    userId,
    username: `media-route-${userId}`,
    email: `media-route-${userId}@artsea.local`,
    passwordHash: "test-only",
  });
  await db.insert(categories).values({
    categoryId,
    userId,
    namePln: `Test ${userId}`,
    nameEng: `Test ${userId}`,
  });
  await db.insert(artPieces).values([
    { artPieceId: visibleArtworkId, userId, categoryId, isVisible: true, titleEng: "Visible test work" },
    { artPieceId: hiddenArtworkId, userId, categoryId, isVisible: false, titleEng: "Hidden test work" },
  ]);

  for (const fileType of Object.keys(contentFor) as (keyof typeof contentFor)[]) {
    const mediaId = randomUUID();
    mediaIdByType.set(fileType, mediaId);
    const content = contentFor[fileType];
    await db.insert(media).values({
      mediaId,
      artPieceId: fileType === "mp4" ? hiddenArtworkId : visibleArtworkId,
      content,
      contentHash: createHash("sha256").update(content).digest("hex"),
      fileType,
      orderIndex: 0,
    });
  }

  const unsupportedMediaId = randomUUID();
  mediaIdByType.set("visible-mp4", unsupportedMediaId);
  const content = contentFor.mp4;
  await db.insert(media).values({
    mediaId: unsupportedMediaId,
    artPieceId: visibleArtworkId,
    content,
    contentHash: createHash("sha256").update(content).digest("hex"),
    fileType: "mp4",
    orderIndex: 1,
  });
});

test.afterAll(async () => {
  await db.delete(users).where(eq(users.userId, userId));
});

test("serves exact PNG, JPG, and GIF bytes with required headers", async () => {
  const expectedTypes: Record<SupportedType, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    gif: "image/gif",
  };

  for (const fileType of Object.keys(expectedTypes) as SupportedType[]) {
    const content = contentFor[fileType];
    const hash = createHash("sha256").update(content).digest("hex");
    const response = await requestMedia(mediaIdByType.get(fileType)!);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(expectedTypes[fileType]);
    expect(response.headers.get("content-length")).toBe(String(content.byteLength));
    expect(response.headers.get("etag")).toBe(`"${hash}"`);
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer()).equals(content)).toBe(true);
  }
});

test("serves visible MP4 media through the generic endpoint", async () => {
  const content = contentFor.mp4;
  const hash = createHash("sha256").update(content).digest("hex");
  const response = await requestMedia(mediaIdByType.get("visible-mp4")!);

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("video/mp4");
  expect(response.headers.get("content-length")).toBe(String(content.byteLength));
  expect(response.headers.get("etag")).toBe(`"${hash}"`);
  expect(Buffer.from(await response.arrayBuffer()).equals(content)).toBe(true);
});

test("returns a header-only 304 only for a matching quoted ETag", async () => {
  const content = contentFor.png;
  const hash = createHash("sha256").update(content).digest("hex");
  const matching = await requestMedia(mediaIdByType.get("png")!, `"${hash}"`);
  const nonmatching = await requestMedia(mediaIdByType.get("png")!, `"${"0".repeat(64)}"`);

  expect(matching.status).toBe(304);
  expect(matching.headers.get("content-length")).toBeNull();
  expect(matching.headers.get("etag")).toBe(`"${hash}"`);
  expect(matching.headers.get("content-type")).toBe("image/png");
  expect(Buffer.from(await matching.arrayBuffer())).toEqual(Buffer.alloc(0));
  expect(nonmatching.status).toBe(200);
  expect(Buffer.from(await nonmatching.arrayBuffer()).equals(content)).toBe(true);
});

test("does not disclose hidden, missing, malformed, or unsupported media", async () => {
  const responses = await Promise.all([
    requestMedia(mediaIdByType.get("mp4")!),
    requestMedia(randomUUID()),
    requestMedia("not-a-uuid"),
  ]);

  for (const response of responses) {
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  }
});
