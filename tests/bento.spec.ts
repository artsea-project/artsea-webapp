import { expect, test } from "@playwright/test"

import { hasSameTiles, normalizeBentoLayout } from "../lib/bento-layout"
import type { BentoLayoutItem } from "../types/bento"

const tileId = "a7f3bc01-0000-4000-8000-000000000501"
const otherTileId = "a7f3bc01-0000-4000-8000-000000000502"
const artPieceId = "a7f3bc01-0000-4000-8000-000000000101"
const mediaId = "a7f3bc01-0000-4000-8000-000000000201"

function tile(
    id: string,
    columnStart: number,
    rowStart: number,
    columnSpan: number,
    rowSpan: number
): BentoLayoutItem {
    return { tileId: id, artPieceId, mediaId, columnStart, rowStart, columnSpan, rowSpan }
}

test("normalizes only valid layout entries within their column contract", () => {
    expect(
        normalizeBentoLayout(
            {
                items: [
                    {
                        tileId,
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 1,
                        columnSpan: 4,
                        rowSpan: 10,
                    },
                    {
                        tileId,
                        artPieceId,
                        mediaId,
                        columnStart: 11,
                        rowStart: 1,
                        columnSpan: 2,
                        rowSpan: 1,
                    },
                    {
                        tileId,
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 0,
                        columnSpan: 1,
                        rowSpan: 1,
                    },
                    {
                        tileId,
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 32,
                        columnSpan: 1,
                        rowSpan: 2,
                    },
                    {
                        tileId,
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 33,
                        columnSpan: 1,
                        rowSpan: 1,
                    },
                    {
                        tileId,
                        artPieceId,
                        mediaId,
                        columnStart: 1,
                        rowStart: 32,
                        columnSpan: 1,
                        rowSpan: 1,
                    },
                    {
                        tileId,
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
        { tileId, artPieceId, mediaId, columnStart: 1, rowStart: 1, columnSpan: 4, rowSpan: 10 },
        { tileId, artPieceId, mediaId, columnStart: 1, rowStart: 32, columnSpan: 1, rowSpan: 1 },
    ])
    expect(normalizeBentoLayout({ items: [] }, 2)).toEqual([])
    expect(normalizeBentoLayout(undefined, 2)).toEqual([])
})

test("drops entries without a valid tile id", () => {
    const position = { columnStart: 1, rowStart: 1, columnSpan: 1, rowSpan: 1 }

    expect(
        normalizeBentoLayout(
            {
                items: [
                    { artPieceId, mediaId, ...position },
                    { tileId: "not-a-uuid", artPieceId, mediaId, ...position },
                    { tileId: 501, artPieceId, mediaId, ...position },
                ],
            },
            11
        )
    ).toEqual([])
})

test("hasSameTiles compares tile ids with their work and image, not positions", () => {
    const desktop = [tile(tileId, 1, 1, 3, 3), tile(otherTileId, 4, 1, 3, 3)]
    const mobile = [tile(otherTileId, 1, 4, 6, 3), tile(tileId, 1, 1, 3, 3)]

    expect(hasSameTiles(desktop, mobile)).toBe(true)
    expect(hasSameTiles(desktop, mobile.slice(1))).toBe(false)
    expect(
        hasSameTiles(desktop, [
            mobile[0],
            { ...mobile[1], mediaId: "a7f3bc01-0000-4000-8000-000000000202" },
        ])
    ).toBe(false)
    expect(hasSameTiles([], [])).toBe(true)
})
