import { artistLoginEmail } from "@/lib/auth/config"

export const seedArtist = {
    id: "a7f3bc01-0000-4000-8000-000000000001",
    name: "ArtSea Artist",
    email: artistLoginEmail,
} as const

export const developmentSeedPassword = "artsea"

export type ExistingSeedUser = {
    id: string
    name: string
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

export function assertSeedDatabaseUrl(databaseUrl: string | undefined) {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required for development seeding.")
    }
}

export function assertSeedSafety(options: SeedOptions & { existingUsers: ExistingSeedUser[] }) {
    if (
        !options.reset &&
        options.existingUsers.some(
            (user) =>
                user.id !== seedArtist.id ||
                user.name !== seedArtist.name ||
                user.email !== seedArtist.email
        )
    ) {
        throw new Error(
            "Refusing to seed a database with an incompatible user. Run the seed again with --reset to replace existing seed data."
        )
    }
}
