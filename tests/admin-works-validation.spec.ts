import { expect, test } from "@playwright/test"

import {
    buildWorkDescription,
    EMPTY_WORK_DESCRIPTION,
    readWorkDescription,
} from "../lib/works/description"
import {
    checkWorkCategory,
    checkWorkTitles,
    checkYearOfExecution,
    escapeLikePattern,
    normalizeSearchQuery,
    parsePage,
    parseTagIds,
    parseYearOfExecution,
} from "../lib/works/validation"

const VALID_UUID = "6f1c2b3e-4d5a-4b6c-8d7e-9f0a1b2c3d4e"

test.describe("work validation helpers", () => {
    test("requires a title in at least one language", () => {
        expect(checkWorkTitles("  ", "")).toBe("Podaj tytuł pracy w przynajmniej jednym języku.")
        expect(checkWorkTitles("Płynna harmonia", "")).toBeNull()
        expect(checkWorkTitles("", "Fluid harmony")).toBeNull()
    })

    test("accepts an empty year and rejects values out of range", () => {
        expect(checkYearOfExecution("", 2026)).toBeNull()
        expect(checkYearOfExecution("2025", 2026)).toBeNull()
        expect(checkYearOfExecution("999", 2026)).toBe("Podaj rok w zakresie 1000-2026.")
        expect(checkYearOfExecution("2027", 2026)).toBe("Podaj rok w zakresie 1000-2026.")
        expect(checkYearOfExecution("20.5", 2026)).toBe("Podaj rok w zakresie 1000-2026.")
        expect(checkYearOfExecution("abcd", 2026)).toBe("Podaj rok w zakresie 1000-2026.")
        expect(parseYearOfExecution(" 2025 ")).toBe(2025)
        expect(parseYearOfExecution("  ")).toBeNull()
    })

    test("requires a valid category id", () => {
        expect(checkWorkCategory("")).toBe("Wybierz kategorię pracy.")
        expect(checkWorkCategory("not-a-uuid")).toBe("Wybierz kategorię pracy.")
        expect(checkWorkCategory(VALID_UUID)).toBeNull()
    })

    test("deduplicates tag ids and rejects invalid ones", () => {
        expect(parseTagIds([VALID_UUID, VALID_UUID])).toEqual({ tagIds: [VALID_UUID] })
        expect(parseTagIds([])).toEqual({ tagIds: [] })
        expect(parseTagIds([VALID_UUID, "oops"])).toEqual({
            error: "Nieprawidłowy identyfikator tagu.",
        })
    })

    test("normalizes search query and page number", () => {
        expect(normalizeSearchQuery("  płynna   harmonia ")).toBe("płynna harmonia")
        expect(normalizeSearchQuery(undefined)).toBe("")
        expect(normalizeSearchQuery(["a", "b"])).toBe("a")
        expect(parsePage("3")).toBe(3)
        expect(parsePage("0")).toBe(1)
        expect(parsePage("-2")).toBe(1)
        expect(parsePage("1.5")).toBe(1)
        expect(parsePage("abc")).toBe(1)
        expect(parsePage(undefined)).toBe(1)
    })

    test("escapes LIKE wildcards", () => {
        expect(escapeLikePattern("100%_a\\b")).toBe("100\\%\\_a\\\\b")
    })
})

test.describe("work description helpers", () => {
    test("builds a description only when technique or text is provided", () => {
        expect(buildWorkDescription("  ", " ")).toBeNull()
        expect(buildWorkDescription(" Olej ", " Opis ")).toEqual({
            technique: "Olej",
            description: "Opis",
        })
        expect(buildWorkDescription("Olej", "")).toEqual({ technique: "Olej", description: "" })
    })

    test("reads stored descriptions defensively", () => {
        expect(readWorkDescription(null)).toEqual(EMPTY_WORK_DESCRIPTION)
        expect(readWorkDescription({ paragraphs: ["x"] })).toEqual(EMPTY_WORK_DESCRIPTION)
        expect(readWorkDescription({ technique: "Fotografia", description: "Opis" })).toEqual({
            technique: "Fotografia",
            description: "Opis",
        })
    })
})
