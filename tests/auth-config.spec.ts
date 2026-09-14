import { expect, test } from "@playwright/test"
import { getPublicUrl } from "@/lib/auth/config"

test.describe("authentication configuration", () => {
    test("uses localhost only outside production", () => {
        const configuredUrl = process.env.ARTSEA_PUBLIC_URL
        delete process.env.ARTSEA_PUBLIC_URL

        try {
            expect(getPublicUrl(undefined, "development").origin).toBe("http://localhost:3000")
            expect(() => getPublicUrl(undefined, "production")).toThrow(/must be set/)
        } finally {
            if (configuredUrl === undefined) {
                delete process.env.ARTSEA_PUBLIC_URL
            } else {
                process.env.ARTSEA_PUBLIC_URL = configuredUrl
            }
        }
    })

    test("requires HTTPS in production", () => {
        expect(() => getPublicUrl("http://example.com", "production")).toThrow(/HTTPS/)
        expect(getPublicUrl("https://example.com", "production").origin).toBe("https://example.com")
    })

    test("accepts only an HTTP origin", () => {
        expect(() => getPublicUrl("https://user@example.com", "development")).toThrow(
            /public origin/
        )
        expect(() => getPublicUrl("https://example.com/admin", "development")).toThrow(
            /public origin/
        )
        expect(() => getPublicUrl("file:///tmp/artsea", "development")).toThrow(/HTTP or HTTPS/)
    })
})
