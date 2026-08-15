import { expect, test } from "@playwright/test"
import {
    assertSeedSafety,
    parseSeedArguments,
    seedArtist,
    type ExistingSeedUser,
} from "../db/seed-guard"

function assertSafety(existingUsers: ExistingSeedUser[], reset = false) {
    return () => assertSeedSafety({ reset, existingUsers })
}

test.describe("seed safety guard", () => {
    test("accepts an empty users table without reset", () => {
        expect(assertSafety([])).not.toThrow()
    })

    test("accepts the deterministic seed user without reset", () => {
        expect(assertSafety([seedArtist])).not.toThrow()
    })

    for (const field of ["userId", "username", "email"] as const) {
        test(`refuses a user with a different ${field} without reset`, () => {
            expect(
                assertSafety([
                    {
                        ...seedArtist,
                        [field]: `different-${seedArtist[field]}`,
                    },
                ])
            ).toThrow(/incompatible user/)
        })
    }

    test("accepts incompatible users with reset", () => {
        expect(
            assertSafety(
                [
                    {
                        ...seedArtist,
                        email: "different@example.com",
                    },
                ],
                true
            )
        ).not.toThrow()
    })

    test("accepts only no arguments or --reset", () => {
        expect(parseSeedArguments([])).toEqual({ reset: false })
        expect(parseSeedArguments(["--reset"])).toEqual({ reset: true })
        expect(() => parseSeedArguments(["--unexpected"])).toThrow(/Unknown seed argument/)
        expect(() => parseSeedArguments(["--reset", "--unexpected"])).toThrow(
            /Unknown seed argument/
        )
    })
})
