import { expect, test } from "@playwright/test"

import {
    addOrRemoveTag,
    buildPortfolioUrl,
    buildPortfolioView,
    collectTagsByCategory,
    distributeIntoColumns,
    keepTagsUsedInCategory,
    parsePortfolioQuery,
    type PortfolioArtwork,
    type PortfolioQuery,
    removeDuplicatesAndSort,
    sortArtworksNewestFirst,
    splitIntoVisibleAndHiddenTags,
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

// 30 visible works with media spread over 3 categories, as in the scenarios from SHAPE.md.
const thirtyArtworks = Array.from({ length: 30 }, (_, index) => artwork(index))
const query = (overrides: Partial<PortfolioQuery> = {}): PortfolioQuery => ({
    category: null,
    tags: [],
    page: 1,
    ...overrides,
})
const ids = (artworks: PortfolioArtwork[]) => artworks.map((item) => item.artPieceId)

test("parses page numbers defensively", () => {
    expect(parsePortfolioQuery({ page: "0" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "-1" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "abc" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "2.5" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: ["2", "3"] }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "99" }).page).toBe(99)
})

test("clamps the page to the last one", () => {
    expect(buildPortfolioView(thirtyArtworks, query({ page: 99 })).query.page).toBe(3)
})

test("treats empty or repeated filters as missing", () => {
    expect(parsePortfolioQuery({})).toEqual({ category: null, tags: [], page: 1 })
    expect(parsePortfolioQuery({ category: "", tag: "  " })).toEqual(query())
    expect(parsePortfolioQuery({ category: ["Rzeźba", "Obraz"] }).category).toBeNull()
    expect(parsePortfolioQuery({ category: "Rzeźba" }).category).toBe("Rzeźba")
})

test("reads every tag from the URL once", () => {
    expect(parsePortfolioQuery({ tag: "natura" }).tags).toEqual(["natura"])
    expect(parsePortfolioQuery({ tag: ["natura", " 3D ", "natura", ""] }).tags).toEqual([
        "natura",
        "3D",
    ])
})

test("orders by year, then newest upload, then id, with undated works last", () => {
    const sameYearOlder = artwork(1, { year: 2020, uploadedAt: new Date("2026-01-01") })
    const sameYearNewer = artwork(2, { year: 2020, uploadedAt: new Date("2026-02-01") })
    const tieA = artwork(3, { year: 2020, uploadedAt: new Date("2026-01-01") })
    const undated = artwork(4, { year: null, uploadedAt: new Date("2026-12-01") })
    const newest = artwork(5, { year: 2024 })

    expect(
        ids(sortArtworksNewestFirst([undated, sameYearOlder, tieA, newest, sameYearNewer]))
    ).toEqual(ids([newest, sameYearNewer, sameYearOlder, tieA, undated]))
})

test("removes duplicate labels and sorts them in Polish order", () => {
    expect(removeDuplicatesAndSort(["żaba", "ala", "ćma", "ala", "cyna", "zebra"])).toEqual([
        "ala",
        "cyna",
        "ćma",
        "zebra",
        "żaba",
    ])
})

test("loads 12, 24, then 30 works and hides the button at the end", () => {
    const first = buildPortfolioView(thirtyArtworks, query())
    const second = buildPortfolioView(thirtyArtworks, query({ page: 2 }))
    const third = buildPortfolioView(thirtyArtworks, query({ page: 3 }))

    expect(first.items).toHaveLength(12)
    expect(first.hasMore).toBe(true)
    expect(second.items).toHaveLength(24)
    expect(ids(second.items).slice(0, 12)).toEqual(ids(first.items))
    expect(third.items).toHaveLength(30)
    expect(third.hasMore).toBe(false)
    expect(first.items[0].year).toBe(2029)
})

test("lists categories and tags alphabetically, narrowing tags to the category", () => {
    const all = buildPortfolioView(thirtyArtworks, query())
    const sculpture = buildPortfolioView(thirtyArtworks, query({ category: "Rzeźba" }))

    expect(all.categories).toEqual(["Obraz", "Rysunek", "Rzeźba"])
    expect(all.tags).toEqual(["3D", "minimalizm", "natura", "typografia"])
    expect(sculpture.tags).toEqual(["3D", "natura"])
    expect(sculpture.items.every((item) => item.category === "Rzeźba")).toBe(true)
})

test("combines category and every selected tag with AND", () => {
    const view = buildPortfolioView(
        thirtyArtworks,
        query({ category: "Rzeźba", tags: ["natura", "3D"], page: 3 })
    )
    const hasCategoryAndTags = (item: PortfolioArtwork) =>
        item.category === "Rzeźba" && item.tags.includes("natura") && item.tags.includes("3D")

    expect(view.items.length).toBeGreaterThan(0)
    expect(view.items.every(hasCategoryAndTags)).toBe(true)
    expect(view.items).toHaveLength(thirtyArtworks.filter(hasCategoryAndTags).length)
})

test("returns no works when no work has all the selected tags", () => {
    const view = buildPortfolioView(thirtyArtworks, query({ tags: ["3D", "typografia"] }))

    expect(view.query.tags).toEqual(["3D", "typografia"])
    expect(view.items).toEqual([])
    expect(view.hasMore).toBe(false)
})

test("drops tags that the selected category does not use", () => {
    const view = buildPortfolioView(
        thirtyArtworks,
        query({ category: "Rysunek", tags: ["natura", "typografia"] })
    )

    expect(view.query).toEqual({ category: "Rysunek", tags: ["typografia"], page: 1 })
})

test("keeps selected tags in the order of the tag list", () => {
    const view = buildPortfolioView(thirtyArtworks, query({ tags: ["natura", "3D"] }))

    expect(view.query.tags).toEqual(["3D", "natura"])
})

test("treats unknown filters as no filter", () => {
    const view = buildPortfolioView(
        thirtyArtworks,
        query({ category: "Fotografia", tags: ["nieistniejący"] })
    )

    expect(view.query).toEqual({ category: null, tags: [], page: 1 })
    expect(view.items).toHaveLength(12)
    expect(buildPortfolioView([], query({ category: "Rzeźba" })).categories).toEqual([])
})

test("builds portfolio URLs without default values", () => {
    expect(buildPortfolioUrl(query())).toBe("/portfolio")
    expect(buildPortfolioUrl(query({ page: 2 }))).toBe("/portfolio?page=2")
    expect(buildPortfolioUrl(query({ category: "Rzeźba", tags: ["3D", "natura"], page: 2 }))).toBe(
        "/portfolio?category=Rze%C5%BAba&tag=3D&tag=natura&page=2"
    )
})

test("collects the tags used in each category", () => {
    const tagsByCategory = collectTagsByCategory(thirtyArtworks)

    expect([...tagsByCategory.get("Rzeźba")!].sort()).toEqual(["3D", "natura"])
    expect(tagsByCategory.get("Rysunek")!.has("natura")).toBe(false)
    expect(collectTagsByCategory([]).size).toBe(0)
})

test("keeps only the tags the target category uses", () => {
    const tagsByCategory = collectTagsByCategory(thirtyArtworks)

    expect(keepTagsUsedInCategory("Rzeźba", ["3D", "typografia"], tagsByCategory)).toEqual(["3D"])
    expect(keepTagsUsedInCategory(null, ["3D", "typografia"], tagsByCategory)).toEqual([
        "3D",
        "typografia",
    ])
    expect(keepTagsUsedInCategory("Fotografia", ["3D"], tagsByCategory)).toEqual([])
})

test("toggles a tag on and off", () => {
    expect(addOrRemoveTag(["3D"], "natura")).toEqual(["3D", "natura"])
    expect(addOrRemoveTag(["3D", "natura"], "3D")).toEqual(["natura"])
})

test("shows selected tags first and never hides them", () => {
    const tags = ["a", "b", "c", "d", "e"]

    expect(splitIntoVisibleAndHiddenTags(tags, [], 3)).toEqual({
        visible: ["a", "b", "c"],
        hidden: ["d", "e"],
    })
    expect(splitIntoVisibleAndHiddenTags(tags, ["e"], 3)).toEqual({
        visible: ["e", "a", "b"],
        hidden: ["c", "d"],
    })
    expect(splitIntoVisibleAndHiddenTags(tags, ["e", "d", "c", "b"], 3)).toEqual({
        visible: ["e", "d", "c", "b"],
        hidden: ["a"],
    })
})

test("keeps earlier cards in place when more cards are appended", () => {
    const cards = Array.from({ length: 24 }, (_, index) => ({
        id: index,
        width: 100 + ((index * 37) % 90),
        height: 100 + ((index * 53) % 140),
    }))

    for (const columnCount of [1, 2, 3]) {
        const firstPage = distributeIntoColumns(cards.slice(0, 12), columnCount)
        const bothPages = distributeIntoColumns(cards, columnCount)

        expect(firstPage).toHaveLength(columnCount)
        firstPage.forEach((column, index) => {
            expect(bothPages[index].slice(0, column.length)).toEqual(column)
        })
        expect(bothPages.flat()).toHaveLength(24)
    }
    expect(distributeIntoColumns(cards.slice(0, 3), 0)).toEqual([cards.slice(0, 3)])
})

test("places the next card in the shortest column, leftmost on ties", () => {
    const tall = { id: "tall", width: 1, height: 3 }
    const square = { id: "square", width: 1, height: 1 }
    const next = { id: "next", width: 1, height: 1 }

    expect(distributeIntoColumns([tall, square, next], 2)).toEqual([[tall], [square, next]])
    expect(distributeIntoColumns([square, square, square], 3)).toEqual([
        [square],
        [square],
        [square],
    ])
})
