import { expect, test } from "@playwright/test"

import { describePreset, type TileBox } from "../lib/bento-grid"

function box(columnStart: number, rowStart: number, columnSpan: number, rowSpan: number): TileBox {
    return { columnStart, rowStart, columnSpan, rowSpan }
}

test("describePreset names the preset of a tile", () => {
    expect(describePreset(box(1, 1, 3, 3))).toBe("1:1")
    expect(describePreset(box(1, 1, 6, 3))).toBe("2:1")
    expect(describePreset(box(1, 1, 3, 6))).toBe("1:2")
    expect(describePreset(box(1, 1, 6, 6))).toBe("2:2")
    expect(describePreset(box(1, 1, 4, 5))).toBeNull()
})
