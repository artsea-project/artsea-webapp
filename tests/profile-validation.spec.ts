import { expect, test } from "@playwright/test"

import {
    MAX_PROFILE_IMAGE_BYTES,
    checkFullName,
    checkLinkName,
    checkProfileImageFile,
    detectProfileImageType,
    displayLinkUrl,
    joinParagraphs,
    normalizeContactEmail,
    normalizeLinkUrl,
    splitParagraphs,
} from "../lib/profile/validation"

test.describe("bio paragraphs", () => {
    test("splits on blank lines and drops empty paragraphs", () => {
        expect(splitParagraphs("  Pierwszy.  \n\n\n\nDrugi\nciąg dalszy.\n\n   \n\n")).toEqual([
            "Pierwszy.",
            "Drugi\nciąg dalszy.",
        ])
    })

    test("accepts Windows line endings and empty text", () => {
        expect(splitParagraphs("Jeden.\r\n\r\nDwa.")).toEqual(["Jeden.", "Dwa."])
        expect(splitParagraphs("   ")).toEqual([])
    })

    test("joins paragraphs back with one blank line", () => {
        expect(joinParagraphs(["Jeden.", "Dwa."])).toBe("Jeden.\n\nDwa.")
    })
})

test.describe("personal data", () => {
    test("requires a full name", () => {
        expect(checkFullName("  ")).toBe("Podaj imię i nazwisko.")
        expect(checkFullName("Élise Roux")).toBeNull()
    })

    test("treats an empty contact email as no email", () => {
        expect(normalizeContactEmail("  ")).toEqual({ email: null })
    })

    test("rejects an incomplete contact email and trims a valid one", () => {
        expect(normalizeContactEmail("elise@")).toEqual({ error: "Podaj poprawny adres e-mail." })
        expect(normalizeContactEmail(" elise.roux@artsea.pl ")).toEqual({
            email: "elise.roux@artsea.pl",
        })
    })
})

test.describe("profile image", () => {
    test("recognizes PNG and JPG by their first bytes only", () => {
        expect(detectProfileImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]))).toBe("png")
        expect(detectProfileImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg")
        expect(detectProfileImageType(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull()
    })

    test("rejects other formats and files over 2 MB", () => {
        expect(checkProfileImageFile({ size: 1024, type: "image/gif" })).toBe(
            "Wybierz plik JPG albo PNG."
        )
        expect(checkProfileImageFile({ size: 3 * 1024 * 1024, type: "image/png" })).toBe(
            "Plik jest większy niż 2 MB."
        )
        expect(checkProfileImageFile({ size: MAX_PROFILE_IMAGE_BYTES, type: "image/jpeg" })).toBe(
            null
        )
    })
})

test.describe("links", () => {
    test("requires a display text", () => {
        expect(checkLinkName("")).toBe("Podaj wyświetlany tekst.")
        expect(checkLinkName("Pinterest")).toBeNull()
    })

    test("adds https to a bare address and keeps a full one as typed", () => {
        expect(normalizeLinkUrl(" pinterest.com/elise ")).toEqual({
            url: "https://pinterest.com/elise",
        })
        expect(normalizeLinkUrl("https://elise.pl")).toEqual({ url: "https://elise.pl" })
        expect(normalizeLinkUrl("http://elise.pl/blog")).toEqual({ url: "http://elise.pl/blog" })
    })

    test("rejects empty links and schemes other than http and https", () => {
        const schemeError = { error: "Link musi zaczynać się od http:// albo https://." }

        expect(normalizeLinkUrl("")).toEqual({ error: "Podaj link." })
        expect(normalizeLinkUrl("javascript:alert(1)")).toEqual(schemeError)
        expect(normalizeLinkUrl("ftp://elise.pl")).toEqual(schemeError)
    })

    test("shows a link without its scheme and trailing slash", () => {
        expect(displayLinkUrl("https://instagram.com/elise.roux/")).toBe("instagram.com/elise.roux")
        expect(displayLinkUrl("http://elise.pl")).toBe("elise.pl")
    })
})
