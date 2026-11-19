import { expect, test } from "@playwright/test"

import { otherLocale } from "../lib/i18n/localized-key"
import { localizedText } from "../lib/i18n/localized-text"

test.describe("localized text", () => {
    test("returns the text when the current language has it", () => {
        expect(localizedText("Olej na płótnie", "")).toEqual({
            kind: "text",
            text: "Olej na płótnie",
        })
        expect(localizedText("Olej na płótnie", "Oil on canvas")).toEqual({
            kind: "text",
            text: "Olej na płótnie",
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
