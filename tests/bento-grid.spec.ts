import { expect, test } from "@playwright/test"

import {
    DESKTOP_GRID,
    MOBILE_GRID,
    describePreset,
    fitsGrid,
    hasOverlaps,
    overlaps,
    type TileBox,
} from "../lib/bento-grid"

function box(columnStart: number, rowStart: number, columnSpan: number, rowSpan: number): TileBox {
    return { columnStart, rowStart, columnSpan, rowSpan }
}

test("fitsGrid accepts only preset sizes on field boundaries inside the grid", () => {
    expect(fitsGrid(box(1, 1, 3, 3), DESKTOP_GRID)).toBe(true)
    expect(fitsGrid(box(7, 4, 6, 6), DESKTOP_GRID)).toBe(true)
    expect(fitsGrid(box(10, 1, 6, 3), DESKTOP_GRID)).toBe(false)
    expect(fitsGrid(box(1, 7, 3, 6), DESKTOP_GRID)).toBe(false)
    expect(fitsGrid(box(2, 1, 3, 3), DESKTOP_GRID)).toBe(false)
    expect(fitsGrid(box(1, 1, 4, 5), DESKTOP_GRID)).toBe(false)
    expect(fitsGrid(box(1, 1, 9, 3), DESKTOP_GRID)).toBe(false)
    expect(fitsGrid(box(1, 88, 6, 3), MOBILE_GRID)).toBe(true)
})

test("overlaps treats touching edges as free", () => {
    expect(overlaps(box(1, 1, 3, 3), box(4, 1, 3, 3))).toBe(false)
    expect(overlaps(box(1, 1, 3, 3), box(1, 4, 3, 3))).toBe(false)
    expect(overlaps(box(1, 1, 3, 3), box(3, 3, 3, 3))).toBe(true)
    expect(hasOverlaps([box(1, 1, 3, 3), box(4, 1, 3, 3), box(6, 2, 2, 2)])).toBe(true)
    expect(hasOverlaps([box(1, 1, 3, 3), box(4, 1, 3, 3)])).toBe(false)
})

test("describePreset names the preset of a tile", () => {
    expect(describePreset(box(1, 1, 3, 3))).toBe("1:1")
    expect(describePreset(box(1, 1, 6, 3))).toBe("2:1")
    expect(describePreset(box(1, 1, 3, 6))).toBe("1:2")
    expect(describePreset(box(1, 1, 6, 6))).toBe("2:2")
    expect(describePreset(box(1, 1, 4, 5))).toBeNull()
})
