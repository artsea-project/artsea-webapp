import { expect, test } from "@playwright/test"
import { seedArtist } from "@/db/seed-guard"
import { artistLoginEmail } from "@/lib/auth/config"

test("seed and authentication share an identifier in the reserved invalid domain", () => {
    expect(artistLoginEmail).toBe("artist@artsea.invalid")
    expect(seedArtist.email).toBe(artistLoginEmail)
})
