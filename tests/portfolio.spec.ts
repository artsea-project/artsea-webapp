import { expect, test } from "@playwright/test"

import {
    orderPortfolioArtworks,
    parsePortfolioQuery,
    type PortfolioArtwork,
    uniqueOrderedLabels,
} from "../lib/portfolio"

const CATEGORIES = ["Rzeźba", "Obraz", "Rysunek"] as const
const TAGS_BY_CATEGORY: Record<(typeof CATEGORIES)[number], string[][]> = {
    Rzeźba: [["natura", "3D"], ["3D"]],
    Obraz: [["natura"], ["minimalizm"]],
    Rysunek: [["typografia"], ["minimalizm", "typografia"]],
}

function artwork(index: number, overrides: Partial<PortfolioArtwork> = {}): PortfolioArtwork {
    const category = CATEGORIES[index % CATEGORIES.length]
    return {
        artPieceId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        title: `Praca ${index}`,
        year: 2000 + index,
        uploadedAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
        category,
        tags: TAGS_BY_CATEGORY[category][index % 2],
        cover: { mediaId: `media-${index}`, fileType: "jpg", contentHash: "a".repeat(64) },
        ...overrides,
    }
}

const ids = (artworks: PortfolioArtwork[]) => artworks.map((item) => item.artPieceId)

test("parses page numbers defensively", () => {
    expect(parsePortfolioQuery({ page: "0" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "-1" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "abc" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "2.5" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: ["2", "3"] }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "99" }).page).toBe(99)
})

test("treats empty or repeated filters as missing", () => {
    expect(parsePortfolioQuery({})).toEqual({ category: null, tag: null, page: 1 })
    expect(parsePortfolioQuery({ category: "", tag: "  " }).category).toBeNull()
    expect(parsePortfolioQuery({ tag: ["a", "b"] }).tag).toBeNull()
    expect(parsePortfolioQuery({ category: "Rzeźba" }).category).toBe("Rzeźba")
})

test("orders by year, then newest upload, then id, with undated works last", () => {
    const sameYearOlder = artwork(1, { year: 2020, uploadedAt: new Date("2026-01-01") })
    const sameYearNewer = artwork(2, { year: 2020, uploadedAt: new Date("2026-02-01") })
    const tieA = artwork(3, { year: 2020, uploadedAt: new Date("2026-01-01") })
    const undated = artwork(4, { year: null, uploadedAt: new Date("2026-12-01") })
    const newest = artwork(5, { year: 2024 })

    expect(
        ids(orderPortfolioArtworks([undated, sameYearOlder, tieA, newest, sameYearNewer]))
    ).toEqual(ids([newest, sameYearNewer, sameYearOlder, tieA, undated]))
})

test("removes duplicate labels and sorts them in Polish order", () => {
    expect(uniqueOrderedLabels(["żaba", "ala", "ćma", "ala", "cyna", "zebra"])).toEqual([
        "ala",
        "cyna",
        "ćma",
        "zebra",
        "żaba",
    ])
})
