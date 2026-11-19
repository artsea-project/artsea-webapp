import { expect, test } from "@playwright/test"

import { otherLocale } from "../lib/i18n/localized-key"
import { localizedContent, localizedText } from "../lib/i18n/localized-text"
import { hasParagraphs } from "../lib/profile/content"

test.describe("localized text", () => {
    test("returns the text when the current language has it", () => {
        expect(localizedText("Olej na płótnie", "")).toEqual({
            kind: "content",
            value: "Olej na płótnie",
        })
        expect(localizedText("Olej na płótnie", "Oil on canvas")).toEqual({
            kind: "content",
            value: "Olej na płótnie",
        })
    })

    test("marks a missing translation when only the other language has the text", () => {
        expect(localizedText("", "Oil on canvas")).toEqual({ kind: "missingTranslation" })
        expect(localizedText(" \n\t", "Oil on canvas")).toEqual({ kind: "missingTranslation" })
    })

    test("returns nothing when neither language has the text", () => {
        expect(localizedText("", "")).toBeNull()
        expect(localizedText("\n", " \t ")).toBeNull()
    })

    test("picks the other locale", () => {
        expect(otherLocale("pl")).toBe("en")
        expect(otherLocale("en")).toBe("pl")
    })
})

test.describe("localized paragraphs", () => {
    test("keeps the paragraphs when the current language has them", () => {
        expect(localizedContent(["Write to me."], [], hasParagraphs)).toEqual({
            kind: "content",
            value: ["Write to me."],
        })
    })

    test("marks a missing translation when only the other language has paragraphs", () => {
        expect(localizedContent([], ["Cześć!"], hasParagraphs)).toEqual({
            kind: "missingTranslation",
        })
        expect(localizedContent([" "], ["Napisz do mnie."], hasParagraphs)).toEqual({
            kind: "missingTranslation",
        })
    })

    test("returns nothing when neither language has paragraphs", () => {
        expect(hasParagraphs(["", "  "])).toBe(false)
        expect(localizedContent([""], ["\n"], hasParagraphs)).toBeNull()
    })
})
