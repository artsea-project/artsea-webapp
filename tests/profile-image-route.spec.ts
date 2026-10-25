import { expect, test } from "@playwright/test"

import { profileImagePath, profileImageResponse } from "../lib/profile/image"

const hash = "a".repeat(64)
const content = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const stored = { contentHash: hash, fileType: "jpg" as const }

function respond(overrides: Partial<Parameters<typeof profileImageResponse>[0]> = {}) {
    let contentLoads = 0
    const response = profileImageResponse({
        requestedHash: hash,
        ifNoneMatch: null,
        stored,
        loadContent: async () => {
            contentLoads++
            return content
        },
        ...overrides,
    })

    return { response, contentLoads: () => contentLoads }
}

test("builds the image address from the content hash", () => {
    expect(profileImagePath(hash)).toBe(`/profile-image/${hash}`)
})

test("serves the stored photo with revalidation headers", async () => {
    const response = await respond().response

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(content)
    expect(Object.fromEntries(response.headers)).toMatchObject({
        "cache-control": "public, max-age=0, must-revalidate",
        "content-length": String(content.length),
        "content-type": "image/jpeg",
        etag: `"${hash}"`,
        "x-content-type-options": "nosniff",
    })
})

test("answers 304 without reading the file when the browser has it", async () => {
    const { response, contentLoads } = respond({ ifNoneMatch: `"${hash}"` })

    expect((await response).status).toBe(304)
    expect(contentLoads()).toBe(0)
})

for (const [label, overrides] of [
    ["there is no photo", { stored: null }],
    ["the hash is malformed", { requestedHash: "not-a-hash" }],
    ["the hash belongs to an older photo", { requestedHash: "b".repeat(64) }],
] as const) {
    test(`answers 404 when ${label}`, async () => {
        const { response, contentLoads } = respond(overrides)

        expect((await response).status).toBe(404)
        expect(contentLoads()).toBe(0)
    })
}
