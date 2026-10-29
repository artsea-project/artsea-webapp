import { expect, test } from "@playwright/test"

import { parseBio, parseParagraphs } from "../lib/profile/content"

test.describe("bio sections", () => {
    test("reads intro, highlight and body", () => {
        expect(
            parseBio({ intro: ["Wstęp."], highlight: [], body: ["Pierwszy.", "Drugi."] })
        ).toEqual({ intro: ["Wstęp."], highlight: [], body: ["Pierwszy.", "Drugi."] })
    })

    test("lays out a bio saved as one paragraph list like the about page did", () => {
        expect(parseBio({ paragraphs: ["Wstęp.", "Cytat.", "Dalej.", "Koniec."] })).toEqual({
            intro: ["Wstęp."],
            highlight: ["Cytat."],
            body: ["Dalej.", "Koniec."],
        })
        expect(parseBio({ paragraphs: ["Wstęp."] })).toEqual({
            intro: ["Wstęp."],
            highlight: [],
            body: [],
        })
    })

    test("treats missing or malformed content as empty sections", () => {
        const empty = { intro: [], highlight: [], body: [] }
        expect(parseBio(null)).toEqual(empty)
        expect(parseBio({ intro: "Wstęp.", body: [1, "Tekst."] })).toEqual({
            ...empty,
            body: ["Tekst."],
        })
    })
})

test.describe("contact paragraphs", () => {
    test("keeps only text paragraphs", () => {
        expect(parseParagraphs({ paragraphs: ["Napisz.", 2] })).toEqual(["Napisz."])
        expect(parseParagraphs(undefined)).toEqual([])
    })
})
