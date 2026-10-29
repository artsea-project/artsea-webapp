import type { BioContent } from "@/types/profile"

export const DEFAULT_ABOUT_HEADING = { pln: "O mnie", eng: "About me" }

function stringsOf(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : []
}

function recordOf(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

export function parseParagraphs(value: unknown): string[] {
    return stringsOf(recordOf(value).paragraphs)
}

// Bios saved before the split into sections keep one `paragraphs` list,
// which the about page laid out as intro, highlight and the rest.
export function parseBio(value: unknown): BioContent {
    const content = recordOf(value)

    if ("paragraphs" in content) {
        const paragraphs = stringsOf(content.paragraphs)
        return {
            heading: "",
            intro: paragraphs.slice(0, 1),
            highlight: paragraphs.slice(1, 2),
            body: paragraphs.slice(2),
        }
    }

    return {
        heading: typeof content.heading === "string" ? content.heading : "",
        intro: stringsOf(content.intro),
        highlight: stringsOf(content.highlight),
        body: stringsOf(content.body),
    }
}
