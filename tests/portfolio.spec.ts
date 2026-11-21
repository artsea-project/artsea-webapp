import { expect, test } from "@playwright/test"

import {
    addOrRemoveTag,
    buildPortfolioUrl,
    buildPortfolioView,
    collectTagsByCategory,
    distributeIntoColumns,
    keepTagsUsedInCategory,
    listPageLinks,
    parsePortfolioQuery,
    type PortfolioArtwork,
    type PortfolioLabel,
    type PortfolioQuery,
    removeDuplicatesAndSort,
    sortArtworksNewestFirst,
    splitIntoVisibleAndHiddenTags,
} from "../lib/portfolio"

const label = (id: string, name: string): PortfolioLabel => ({ id, name })
const SCULPTURE = label("c-sculpture", "Rzeźba")
const PAINTING = label("c-painting", "Obraz")
const DRAWING = label("c-drawing", "Rysunek")
const NATURE = label("t-nature", "natura")
const THREE_D = label("t-3d", "3D")
const MINIMALISM = label("t-minimalism", "minimalizm")
const TYPOGRAPHY = label("t-typography", "typografia")

const CATEGORIES = [SCULPTURE, PAINTING, DRAWING]
const TAGS_BY_CATEGORY = new Map([
    [SCULPTURE.id, [[NATURE, THREE_D], [THREE_D]]],
    [PAINTING.id, [[NATURE], [MINIMALISM]]],
    [DRAWING.id, [[TYPOGRAPHY], [MINIMALISM, TYPOGRAPHY]]],
])

function artwork(index: number, overrides: Partial<PortfolioArtwork> = {}): PortfolioArtwork {
    const category = CATEGORIES[index % CATEGORIES.length]
    return {
        artPieceId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        title: `Praca ${index}`,
        year: 2000 + index,
        uploadedAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
        category,
        tags: TAGS_BY_CATEGORY.get(category.id)![index % 2],
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
const names = (labels: PortfolioLabel[]) => labels.map((item) => item.name)
const view = (requested: PortfolioQuery, artworks = thirtyArtworks) =>
    buildPortfolioView(artworks, requested, "pl")

test("parses page numbers defensively", () => {
    expect(parsePortfolioQuery({ page: "0" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "-1" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "abc" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "2.5" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: ["2", "3"] }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "99" }).page).toBe(99)
})

test("clamps the page to the last one", () => {
    expect(view(query({ page: 99 })).query.page).toBe(3)
})

test("treats empty or repeated filters as missing", () => {
    expect(parsePortfolioQuery({})).toEqual({ category: null, tags: [], page: 1 })
    expect(parsePortfolioQuery({ category: "", tag: "  " })).toEqual(query())
    expect(parsePortfolioQuery({ category: [SCULPTURE.id, PAINTING.id] }).category).toBeNull()
    expect(parsePortfolioQuery({ category: SCULPTURE.id }).category).toBe(SCULPTURE.id)
})

test("reads every tag from the URL once", () => {
    expect(parsePortfolioQuery({ tag: NATURE.id }).tags).toEqual([NATURE.id])
    expect(
        parsePortfolioQuery({ tag: [NATURE.id, ` ${THREE_D.id} `, NATURE.id, ""] }).tags
    ).toEqual([NATURE.id, THREE_D.id])
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

test("removes duplicate labels and sorts them in the order of the language", () => {
    const labels = ["żaba", "ala", "ćma", "ala", "cyna", "zebra"].map((name) => label(name, name))

    expect(names(removeDuplicatesAndSort(labels, "pl"))).toEqual([
        "ala",
        "cyna",
        "ćma",
        "zebra",
        "żaba",
    ])
    expect(names(removeDuplicatesAndSort(labels, "en"))).toEqual([
        "ala",
        "ćma",
        "cyna",
        "żaba",
        "zebra",
    ])
})

test("splits 30 works into pages of 12, 12 and 6", () => {
    const first = view(query())
    const second = view(query({ page: 2 }))
    const third = view(query({ page: 3 }))
    const sorted = ids(sortArtworksNewestFirst(thirtyArtworks))

    expect(first.items).toHaveLength(12)
    expect(second.items).toHaveLength(12)
    expect(third.items).toHaveLength(6)
    expect([first, second, third].map((page) => page.pageCount)).toEqual([3, 3, 3])
    expect(
        [...first.items, ...second.items, ...third.items].map((item) => item.artPieceId)
    ).toEqual(sorted)
    expect(first.items[0].year).toBe(2029)
})

test("lists categories and tags alphabetically, narrowing tags to the category", () => {
    const all = view(query())
    const sculpture = view(query({ category: SCULPTURE.id }))

    expect(names(all.categories)).toEqual(["Obraz", "Rysunek", "Rzeźba"])
    expect(names(all.tags)).toEqual(["3D", "minimalizm", "natura", "typografia"])
    expect(names(sculpture.tags)).toEqual(["3D", "natura"])
    expect(sculpture.items.every((item) => item.category.id === SCULPTURE.id)).toBe(true)
})

test("combines category and every selected tag with AND", () => {
    const filtered = view(query({ category: SCULPTURE.id, tags: [NATURE.id, THREE_D.id] }))
    const hasTag = (item: PortfolioArtwork, tag: PortfolioLabel) =>
        item.tags.some(({ id }) => id === tag.id)
    const hasCategoryAndTags = (item: PortfolioArtwork) =>
        item.category.id === SCULPTURE.id && hasTag(item, NATURE) && hasTag(item, THREE_D)

    expect(filtered.items.length).toBeGreaterThan(0)
    expect(filtered.items.every(hasCategoryAndTags)).toBe(true)
    expect(filtered.items).toHaveLength(thirtyArtworks.filter(hasCategoryAndTags).length)
})

test("returns no works when no work has all the selected tags", () => {
    const empty = view(query({ tags: [THREE_D.id, TYPOGRAPHY.id] }))

    expect(empty.query.tags).toEqual([THREE_D.id, TYPOGRAPHY.id])
    expect(empty.items).toEqual([])
    expect(empty.pageCount).toBe(1)
})

test("drops tags that the selected category does not use", () => {
    const drawing = view(query({ category: DRAWING.id, tags: [NATURE.id, TYPOGRAPHY.id] }))

    expect(drawing.query).toEqual({ category: DRAWING.id, tags: [TYPOGRAPHY.id], page: 1 })
})

test("keeps selected tags in the order of the tag list", () => {
    expect(view(query({ tags: [NATURE.id, THREE_D.id] })).query.tags).toEqual([
        THREE_D.id,
        NATURE.id,
    ])
})

test("treats unknown filters as no filter", () => {
    const unknown = view(query({ category: "Rzeźba", tags: ["natura"] }))

    expect(unknown.query).toEqual({ category: null, tags: [], page: 1 })
    expect(unknown.items).toHaveLength(12)
    expect(view(query({ category: SCULPTURE.id }), []).categories).toEqual([])
})

test("keeps the same filters when the names change with the language", () => {
    const english = new Map([
        [SCULPTURE.id, "Sculpture"],
        [NATURE.id, "nature"],
        [THREE_D.id, "3D"],
    ])
    const translate = ({ id, name }: PortfolioLabel) => label(id, english.get(id) ?? name)
    const inEnglish = thirtyArtworks.map((item) => ({
        ...item,
        category: translate(item.category),
        tags: item.tags.map(translate),
    }))
    const requested = query({ category: SCULPTURE.id, tags: [NATURE.id] })
    const polishView = view(requested)
    const englishView = buildPortfolioView(inEnglish, requested, "en")

    expect(englishView.query).toEqual(polishView.query)
    expect(ids(englishView.items)).toEqual(ids(polishView.items))
    expect(names(englishView.tags)).toEqual(["3D", "nature"])
})

test("builds portfolio URLs without default values", () => {
    expect(buildPortfolioUrl(query())).toBe("/portfolio")
    expect(buildPortfolioUrl(query({ page: 2 }))).toBe("/portfolio?page=2")
    expect(
        buildPortfolioUrl(query({ category: SCULPTURE.id, tags: [THREE_D.id, NATURE.id], page: 2 }))
    ).toBe("/portfolio?category=c-sculpture&tag=t-3d&tag=t-nature&page=2")
})

test("lists the first, last and nearby pages with gaps as ellipses", () => {
    expect(listPageLinks(1, 1)).toEqual([1])
    expect(listPageLinks(1, 3)).toEqual([1, 2, 3])
    expect(listPageLinks(1, 10)).toEqual([1, 2, "ellipsis", 10])
    expect(listPageLinks(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
    expect(listPageLinks(6, 10)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 10])
    expect(listPageLinks(10, 10)).toEqual([1, "ellipsis", 9, 10])
})

test("collects the tags used in each category", () => {
    const tagsByCategory = collectTagsByCategory(thirtyArtworks)

    expect([...tagsByCategory.get(SCULPTURE.id)!].sort()).toEqual([THREE_D.id, NATURE.id])
    expect(tagsByCategory.get(DRAWING.id)!.has(NATURE.id)).toBe(false)
    expect(collectTagsByCategory([]).size).toBe(0)
})

test("keeps only the tags the target category uses", () => {
    const tagsByCategory = collectTagsByCategory(thirtyArtworks)

    const both = [THREE_D.id, TYPOGRAPHY.id]

    expect(keepTagsUsedInCategory(SCULPTURE.id, both, tagsByCategory)).toEqual([THREE_D.id])
    expect(keepTagsUsedInCategory(null, both, tagsByCategory)).toEqual(both)
    expect(keepTagsUsedInCategory("c-photography", [THREE_D.id], tagsByCategory)).toEqual([])
})

test("toggles a tag on and off", () => {
    expect(addOrRemoveTag(["3D"], "natura")).toEqual(["3D", "natura"])
    expect(addOrRemoveTag(["3D", "natura"], "3D")).toEqual(["natura"])
})

test("shows selected tags first and never hides them", () => {
    const tags = ["a", "b", "c", "d", "e"].map((name) => label(name, name.toUpperCase()))
    const split = (selected: string[]) => {
        const { visible, hidden } = splitIntoVisibleAndHiddenTags(tags, selected, 3)
        return { visible: names(visible), hidden: names(hidden) }
    }

    expect(split([])).toEqual({ visible: ["A", "B", "C"], hidden: ["D", "E"] })
    expect(split(["e"])).toEqual({ visible: ["E", "A", "B"], hidden: ["C", "D"] })
    expect(split(["e", "d", "c", "b"])).toEqual({ visible: ["E", "D", "C", "B"], hidden: ["A"] })
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
