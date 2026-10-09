import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { assertSeedSafety, parseSeedArguments } from "./seed-guard"
import {
    buildBentoLayout,
    cleanDatabase,
    seedArtistProfile,
    seedArtistUser,
    seedSiteSettings,
    seedSocialLinks,
} from "./seed-common"

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") })

async function main() {
    const seedOptions = parseSeedArguments(process.argv.slice(2))
    console.log("Seeding database...")

    const { db } = await import("./index")
    const { categories, tags, artPieces, media, artPieceTags, users } = await import("./schema")

    const categoryId = "a7f3bc01-0000-4000-8000-000000000002"
    const fixtureDirectory = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "fixtures",
        "sample"
    )

    const artworks = [
        [
            "a7f3bc01-0000-4000-8000-000000000101",
            "a7f3bc01-0000-4000-8000-000000000201",
            "group-13-1.jpg",
            "Campaign “Spring in the City”",
            2025,
            "Marble",
        ],
        [
            "a7f3bc01-0000-4000-8000-000000000102",
            "a7f3bc01-0000-4000-8000-000000000202",
            "group-13-2.jpg",
            "Spring in the City",
            2026,
            "Watercolor",
        ],
        [
            "a7f3bc01-0000-4000-8000-000000000103",
            "a7f3bc01-0000-4000-8000-000000000203",
            "group-13-3.png",
            "Painting",
            2024,
            "Watercolor",
        ],
        [
            "a7f3bc01-0000-4000-8000-000000000104",
            "a7f3bc01-0000-4000-8000-000000000204",
            "group-13-4.jpg",
            "Sculpture",
            2023,
            "Brass",
        ],
        [
            "a7f3bc01-0000-4000-8000-000000000105",
            "a7f3bc01-0000-4000-8000-000000000205",
            "group-13-5.png",
            "Identity Rebranding",
            2024,
            "Poster",
        ],
        [
            "a7f3bc01-0000-4000-8000-000000000106",
            "a7f3bc01-0000-4000-8000-000000000206",
            "group-13-6.png",
            "FinTech Application Design",
            2025,
            "Glass",
        ],
        [
            "a7f3bc01-0000-4000-8000-000000000107",
            "a7f3bc01-0000-4000-8000-000000000207",
            "group-13-7.jpg",
            "Organic Identity",
            2026,
            "Oil",
        ],
    ] as const
    const tagNames = [
        "Marble",
        "Watercolor",
        "Brass",
        "Poster",
        "Glass",
        "Oil",
        "Still Life",
        "Flowers",
        "Classical",
    ] as const
    const tagIdByName = Object.fromEntries(
        tagNames.map((name, index) => [
            name,
            `a7f3bc01-0000-4000-8000-0000000003${String(index + 1).padStart(2, "0")}`,
        ])
    )
    const bentoItems = artworks.map(([artPieceId, mediaId]) => ({ artPieceId, mediaId }))
    const layout = buildBentoLayout(bentoItems)

    const existingUsers = await db
        .select({
            userId: users.userId,
            username: users.username,
            email: users.email,
        })
        .from(users)
    assertSeedSafety({ ...seedOptions, existingUsers })

    await db.transaction(async (tx) => {
        await cleanDatabase(tx)
        await seedArtistUser(tx)

        const profileContent = await readFile(path.join(fixtureDirectory, "profile.jpg"))
        await seedArtistProfile(tx, profileContent)
        await seedSocialLinks(tx)

        await tx
            .insert(categories)
            .values({ categoryId, namePln: "Sztuka", nameEng: "Art" })
            .onConflictDoNothing()

        const tagNamesPln: Record<string, string> = {
            Marble: "Marmur",
            Watercolor: "Akwarela",
            Brass: "Mosiądz",
            Poster: "Plakat",
            Glass: "Szkło",
            Oil: "Olej",
            "Still Life": "Martwa natura",
            Flowers: "Kwiaty",
            Classical: "Klasyczne",
        }

        await tx
            .insert(tags)
            .values(
                tagNames.map((name) => ({
                    tagId: tagIdByName[name],
                    nameEng: name,
                    namePln: tagNamesPln[name],
                }))
            )
            .onConflictDoNothing()

        for (const [
            artPieceId,
            mediaId,
            fixture,
            titleEng,
            yearOfExecution,
            primaryTag,
        ] of artworks) {
            await tx
                .insert(artPieces)
                .values({
                    artPieceId,
                    categoryId,
                    titleEng,
                    titlePln: `${titleEng} (PL)`,
                    dimensions: "70 x 100 cm",
                    miniDescriptionPln: {
                        paragraphs: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
                    },
                    miniDescriptionEng: {
                        paragraphs: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
                    },
                    descriptionPln: {
                        technique:
                            "<b>Lorem ipsum dolor sit amet</b>, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                        description:
                            "Ut enim ad minim veniam, quis nostrud <i>exercitation ullamco laboris</i> nisi ut aliquip ex ea commodo consequat.",
                    },
                    descriptionEng: {
                        technique:
                            "<b>Lorem ipsum dolor sit amet</b>, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                        description:
                            "Ut enim ad minim veniam, quis nostrud <i>exercitation ullamco laboris</i> nisi ut aliquip ex ea commodo consequat.",
                    },
                    yearOfExecution,
                    isVisible: true,
                })
                .onConflictDoNothing()

            const content = await readFile(path.join(fixtureDirectory, fixture))
            await tx
                .insert(media)
                .values({
                    mediaId,
                    artPieceId,
                    content,
                    contentHash: createHash("sha256").update(content).digest("hex"),
                    fileType: path.extname(fixture).slice(1) as "png" | "jpg",
                    orderIndex: 0,
                })
                .onConflictDoNothing()

            const artworkTags =
                titleEng === "Organic Identity"
                    ? [primaryTag, "Still Life", "Flowers", "Classical"]
                    : [primaryTag]
            await tx
                .insert(artPieceTags)
                .values(artworkTags.map((name) => ({ artPieceId, tagId: tagIdByName[name] })))
                .onConflictDoNothing()
        }

        await seedSiteSettings(tx, layout)
    })

    console.log("Database seeded successfully with Bento portfolio data!")
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Failed to seed database:", err)
        process.exit(1)
    })
