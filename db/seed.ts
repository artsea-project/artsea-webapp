import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { assertSeedSafety, parseSeedArguments, seedArtist } from "./seed-guard"
import type { SiteTheme } from "../types/theme"
import type { BentoBoxLayout } from "../types/bento"

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") })

async function main() {
    const seedOptions = parseSeedArguments(process.argv.slice(2))
    console.log("Seeding database...")

    // Dynamically import db and schema to ensure dotenv has already initialized env variables
    const { db } = await import("./index")
    const {
        users,
        profiles,
        categories,
        siteSettings,
        links,
        tags,
        artPieces,
        media,
        artPieceTags,
    } = await import("./schema")

    const categoryId = "a7f3bc01-0000-4000-8000-000000000002"
    const profileId = "a7f3bc01-0000-4000-8000-000000000003"
    const siteSettingsId = "a7f3bc01-0000-4000-8000-000000000004"
    const fixtureDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures")

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
    const desktop = [
        [1, 1, 4, 10],
        [5, 1, 3, 5],
        [5, 6, 3, 5],
        [8, 1, 4, 10],
        [1, 11, 3, 7],
        [4, 11, 4, 7],
        [8, 11, 4, 7],
    ]
    const mobile = [
        [1, 1, 1, 8],
        [2, 1, 1, 5],
        [2, 6, 1, 3],
        [1, 9, 2, 8],
        [1, 17, 1, 6],
        [2, 17, 1, 6],
        [1, 23, 2, 8],
    ]

    const layout: BentoBoxLayout = {
        desktop: {
            items: artworks.map(([artPieceId, mediaId], index) => ({
                artPieceId,
                mediaId,
                columnStart: desktop[index][0],
                rowStart: desktop[index][1],
                columnSpan: desktop[index][2],
                rowSpan: desktop[index][3],
            })),
        },
        mobile: {
            items: artworks.map(([artPieceId, mediaId], index) => ({
                artPieceId,
                mediaId,
                columnStart: mobile[index][0],
                rowStart: mobile[index][1],
                columnSpan: mobile[index][2],
                rowSpan: mobile[index][3],
            })),
        },
    }

    const existingUsers = await db
        .select({
            userId: users.userId,
            username: users.username,
            email: users.email,
        })
        .from(users)
    assertSeedSafety({ ...seedOptions, existingUsers })

    await db.transaction(async (tx) => {
        // Clear existing seed data in reverse-dependency order before every accepted reseed.
        await tx.delete(artPieceTags)
        await tx.delete(media)
        await tx.delete(links)
        await tx.delete(profiles)
        await tx.delete(artPieces)
        await tx.delete(tags)
        await tx.delete(categories)
        await tx.delete(siteSettings)
        await tx.delete(users)

        // 1. Insert User
        await tx
            .insert(users)
            .values({ ...seedArtist, passwordHash: "development-only-not-for-login" })
            .onConflictDoNothing()

        // 2. Insert Profile
        await tx
            .insert(profiles)
            .values({
                profileId,
                fullName: "ArtSea Artist",
                bioPln: {
                    paragraphs: [
                        "Cześć! Nazywam się Anna i jestem niezależną ilustratorką z Gdańska.",
                        "Moja przygoda ze sztuką zaczęła się od tradycyjnego malarstwa, które nauczyło mnie szacunku do światła i barwy. Szybko jednak odkryłam, że cyfrowe płótno daje równie wielkie możliwości wyrazu. Dziś specjalizuję się w łączeniu geometrycznego rygoru z ciepłem organicznych kształtów.",
                        "Współpracowałam z wieloma instytucjami kultury, wydawnictwami i niezależnymi twórcami. Najbardziej cenię sobie projekty, które wymagają nieszablonowego myślenia oraz głębokiego wejścia w kontekst tworzonej opowieści.",
                    ],
                },
                bioEng: {
                    paragraphs: [
                        "Hi! My name is Anna and I am an independent illustrator based in Gdańsk.",
                        "My adventure with art began with traditional painting, which taught me respect for light and color. However, I quickly discovered that the digital canvas offers equally great possibilities of expression. Today, I specialize in combining geometric rigor with the warmth of organic shapes.",
                        "I have collaborated with many cultural institutions, publishing houses, and independent creators. I value projects that require out-of-the-box thinking and a deep dive into the context of the story being created.",
                    ],
                },
                contactPln: {
                    paragraphs: ["Jeśli podoba Ci się moje podejście do designu, napisz do mnie."],
                },
                contactEng: {
                    paragraphs: ["If you like my approach to design, feel free to write to me."],
                },
            })
            .onConflictDoNothing()

        // 3. Insert Social Links
        await tx
            .insert(links)
            .values([
                { name: "instagram", url: "https://instagram.com/elise_roux" },
                { name: "behance", url: "https://behance.net/elise_roux" },
            ])
            .onConflictDoNothing()

        // 4. Insert Category
        await tx
            .insert(categories)
            .values({ categoryId, namePln: "Sztuka", nameEng: "Art" })
            .onConflictDoNothing()

        // 5. Insert Tags
        await tx
            .insert(tags)
            .values(tagNames.map((name) => ({ tagId: tagIdByName[name], nameEng: name })))
            .onConflictDoNothing()

        // 6. Insert Art Pieces, Media content, and Tag relations
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
                        paragraphs: [
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
                        ],
                    },
                    descriptionEng: {
                        paragraphs: [
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
                        ],
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

        // 7. Insert Site Settings with Bento layout and default theme
        const mockTheme: SiteTheme = {
            fonts: {
                primaryFont: "Playfair Display",
                secondaryFont: "Inter",
                additionalFont: "Inter",
            },
            colors: {
                primaryColor: "#292524",
                secondaryColor: "#A8A29E",
                additionalColor: "#1C1917",
                accentColor: "#A8A29E",
                backgroundColor: "#FFFFFF",
            },
            presetTheme: "default",
            darkModeExperimental: false,
        }

        await tx
            .insert(siteSettings)
            .values({ siteSettingsId, theme: mockTheme, layoutBentoBox: layout })
            .onConflictDoNothing()
    })

    console.log("Database seeded successfully with Bento portfolio data!")
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Failed to seed database:", err)
        process.exit(1)
    })
