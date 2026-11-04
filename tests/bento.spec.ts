import { expect, test } from "@playwright/test"

import { DESKTOP_GRID, MOBILE_GRID } from "../lib/bento-grid"
import { hasSameTiles, normalizeBentoLayout } from "../lib/bento-layout"
import type { BentoLayoutItem } from "../types/bento"

const artPieceId = "a7f3bc01-0000-4000-8000-000000000101"
const mediaId = "a7f3bc01-0000-4000-8000-000000000201"
const tileIds = [
    "a7f3bc01-0000-4000-8000-000000000501",
    "a7f3bc01-0000-4000-8000-000000000502",
    "a7f3bc01-0000-4000-8000-000000000503",
    "a7f3bc01-0000-4000-8000-000000000504",
]

function tile(
    tileId: string,
    columnStart: number,
    rowStart: number,
    columnSpan: number,
    rowSpan: number
): BentoLayoutItem {
    return { tileId, artPieceId, mediaId, columnStart, rowStart, columnSpan, rowSpan }
}

test("keeps desktop preset tiles that fit the 12 x 9 grid", () => {
    expect(
        normalizeBentoLayout(
            {
                items: [
                    tile(tileIds[0], 1, 1, 3, 6),
                    tile(tileIds[1], 7, 7, 6, 3),
                    tile(tileIds[2], 10, 1, 6, 3),
                    tile(tileIds[3], 1, 7, 3, 6),
                ],
            },
            DESKTOP_GRID
        )
    ).toEqual([tile(tileIds[0], 1, 1, 3, 6), tile(tileIds[1], 7, 7, 6, 3)])
})

test("rejects sizes other than 1:1, 2:1, 1:2 and 2:2 and tiles off the field boundaries", () => {
    expect(
        normalizeBentoLayout(
            {
                items: [
                    tile(tileIds[0], 1, 1, 4, 5),
                    tile(tileIds[1], 1, 1, 9, 3),
                    tile(tileIds[2], 2, 1, 3, 3),
                    tile(tileIds[3], 1, 3, 3, 3),
                ],
            },
            DESKTOP_GRID
        )
    ).toEqual([])
})

test("rejects tiles without a tile id or with invalid ids", () => {
    const { tileId: _omitted, ...withoutTileId } = tile(tileIds[0], 1, 1, 3, 3)
    void _omitted

    expect(
        normalizeBentoLayout(
            {
                items: [
                    withoutTileId,
                    { ...tile(tileIds[1], 1, 1, 3, 3), artPieceId: "invalid" },
                    { ...tile(tileIds[2], 1, 1, 3, 3), columnStart: 1.5 },
                ],
            },
            DESKTOP_GRID
        )
    ).toEqual([])
})

test("drops repeated tile ids and tiles overlapping an earlier one", () => {
    expect(
        normalizeBentoLayout(
            {
                items: [
                    tile(tileIds[0], 1, 1, 3, 3),
                    tile(tileIds[0], 7, 1, 3, 3),
                    tile(tileIds[1], 1, 1, 6, 6),
                    tile(tileIds[2], 4, 1, 3, 3),
                ],
            },
            DESKTOP_GRID
        )
    ).toEqual([tile(tileIds[0], 1, 1, 3, 3), tile(tileIds[2], 4, 1, 3, 3)])
})

test("mobile grid is two fields wide and up to 90 rows tall", () => {
    expect(
        normalizeBentoLayout(
            {
                items: [
                    tile(tileIds[0], 1, 88, 6, 3),
                    tile(tileIds[1], 4, 1, 3, 3),
                    tile(tileIds[2], 7, 10, 3, 3),
                    tile(tileIds[3], 1, 91, 3, 3),
                ],
            },
            MOBILE_GRID
        )
    ).toEqual([tile(tileIds[0], 1, 88, 6, 3), tile(tileIds[1], 4, 1, 3, 3)])
})

test("returns an empty list for missing or malformed layouts", () => {
    expect(normalizeBentoLayout({ items: [] }, MOBILE_GRID)).toEqual([])
    expect(normalizeBentoLayout(undefined, MOBILE_GRID)).toEqual([])
    expect(normalizeBentoLayout({ items: "nope" }, DESKTOP_GRID)).toEqual([])
})

test("hasSameTiles compares tile ids with their work and image, not positions", () => {
    const desktop = [tile(tileIds[0], 1, 1, 3, 3), tile(tileIds[1], 4, 1, 3, 3)]
    const mobile = [tile(tileIds[1], 1, 4, 6, 3), tile(tileIds[0], 1, 1, 3, 3)]

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
