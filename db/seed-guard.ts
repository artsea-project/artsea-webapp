export const seedArtist = {
    userId: "a7f3bc01-0000-4000-8000-000000000001",
    username: "artsea-artist",
    email: "artist@artsea.local",
} as const

export type ExistingSeedUser = {
    userId: string
    username: string
    email: string
}

type SeedOptions = {
    reset: boolean
}

export function parseSeedArguments(args: readonly string[]): SeedOptions {
    if (args.length === 0) {
        return { reset: false }
    }

    if (args.length === 1 && args[0] === "--reset") {
        return { reset: true }
    }

    throw new Error("Unknown seed argument. Use --reset to replace existing seed data.")
}

export function assertSeedSafety(options: SeedOptions & { existingUsers: ExistingSeedUser[] }) {
    if (
        !options.reset &&
        options.existingUsers.some(
            (user) =>
                user.userId !== seedArtist.userId ||
                user.username !== seedArtist.username ||
                user.email !== seedArtist.email
        )
    ) {
        throw new Error(
            "Refusing to seed a database with an incompatible user. Run npm run db:seed -- --reset to replace existing seed data."
        )
    }
}
