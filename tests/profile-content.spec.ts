import { expect, test } from "@playwright/test"

import { parseBio, parseParagraphs } from "../lib/profile/content"

test.describe("bio sections", () => {
    test("reads heading, intro, highlight and body", () => {
        const bio = {
            heading: "Kim jestem",
            intro: ["Wstęp."],
            highlight: [],
            body: ["Pierwszy.", "Drugi."],
        }
        expect(parseBio(bio)).toEqual(bio)
    })

    test("lays out a bio saved as one paragraph list like the about page did", () => {
        expect(parseBio({ paragraphs: ["Wstęp.", "Cytat.", "Dalej.", "Koniec."] })).toEqual({
            heading: "",
            intro: ["Wstęp."],
            highlight: ["Cytat."],
            body: ["Dalej.", "Koniec."],
        })
        expect(parseBio({ paragraphs: ["Wstęp."] })).toEqual({
            heading: "",
            intro: ["Wstęp."],
            highlight: [],
            body: [],
        })
    })

    test("treats missing or malformed content as empty sections", () => {
        const empty = { heading: "", intro: [], highlight: [], body: [] }
        expect(parseBio(null)).toEqual(empty)
        expect(parseBio({ heading: 7, intro: "Wstęp.", body: [1, "Tekst."] })).toEqual({
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
