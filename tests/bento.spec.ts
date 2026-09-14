import { expect, test } from "@playwright/test"

import { normalizeBentoLayout } from "../lib/bento-layout"

const artPieceId = "a7f3bc01-0000-4000-8000-000000000101"
const mediaId = "a7f3bc01-0000-4000-8000-000000000201"

test("normalizes only valid layout entries within their column contract", () => {
    expect(
        normalizeBentoLayout(
            {
                items: [
                    {
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 1,
                        columnSpan: 4,
                        rowSpan: 10,
                    },
                    {
                        artPieceId,
                        mediaId,
                        columnStart: 11,
                        rowStart: 1,
                        columnSpan: 2,
                        rowSpan: 1,
                    },
                    { artPieceId, mediaId, columnStart: 1, rowStart: 0, columnSpan: 1, rowSpan: 1 },
                    {
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 32,
                        columnSpan: 1,
                        rowSpan: 2,
                    },
                    {
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 33,
                        columnSpan: 1,
                        rowSpan: 1,
                    },
                    {
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 32,
                        columnSpan: 1,
                        rowSpan: 1,
                    },
                    {
                        artPieceId: "invalid",
                        mediaId,
                        columnStart: 1,
                        rowStart: 1,
                        columnSpan: 1,
                        rowSpan: 1,
                    },
                ],
            },
            11
        )
    ).toEqual([
        { artPieceId, mediaId, columnStart: 1, rowStart: 1, columnSpan: 4, rowSpan: 10 },
        { artPieceId, mediaId, columnStart: 1, rowStart: 32, columnSpan: 1, rowSpan: 1 },
    ])
    expect(normalizeBentoLayout({ items: [] }, 2)).toEqual([])
    expect(normalizeBentoLayout(undefined, 2)).toEqual([])
})
