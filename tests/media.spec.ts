import { expect, test } from "@playwright/test";

import { isBentoMediaType, isMediaType, mediaHeaders } from "../lib/media";

test("maps supported Bento media types to safe revalidation headers", () => {
  const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
  const headers = mediaHeaders({
    content,
    contentHash: "a".repeat(64),
    fileType: "png",
  });

  expect(headers).toEqual({
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Content-Length": "6",
    "Content-Type": "image/png",
    ETag: `"${"a".repeat(64)}"`,
    "X-Content-Type-Options": "nosniff",
  });
  expect(isMediaType("jpg")).toBe(true);
  expect(isMediaType("gif")).toBe(true);
  expect(isMediaType("mp4")).toBe(true);
  expect(isBentoMediaType("jpg")).toBe(true);
  expect(isBentoMediaType("gif")).toBe(true);
  expect(isBentoMediaType("mp4")).toBe(false);
});
