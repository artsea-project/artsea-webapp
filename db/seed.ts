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

const fixtureDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures")

const categoryIds = {
    art: "a7f3bc01-0000-4000-8000-000000000002",
    sculpture: "a7f3bc01-0000-4000-8000-000000000005",
    photography: "a7f3bc01-0000-4000-8000-000000000006",
    painting: "a7f3bc01-0000-4000-8000-000000000007",
    design: "a7f3bc01-0000-4000-8000-000000000008",
} as const

const categoryRows = [
    { categoryId: categoryIds.art, namePln: "Sztuka", nameEng: "Art" },
    { categoryId: categoryIds.sculpture, namePln: "Rzeźba", nameEng: "Sculpture" },
    { categoryId: categoryIds.photography, namePln: "Fotografia", nameEng: "Photography" },
    { categoryId: categoryIds.painting, namePln: "Malarstwo", nameEng: "Painting" },
    {
        categoryId: categoryIds.design,
        namePln: "Projektowanie graficzne",
        nameEng: "Graphic design",
    },
]

// English name -> Polish name. The tag id comes from the position, so new tags go at the end.
const tagNamesPln = {
    Marble: "Marmur",
    Watercolor: "Akwarela",
    Brass: "Mosiądz",
    Poster: "Plakat",
    Glass: "Szkło",
    Oil: "Olej",
    "Still Life": "Martwa natura",
    Flowers: "Kwiaty",
    Classical: "Klasyczne",
    Photography: "Fotografia",
    Stone: "Kamień",
    Sea: "Morze",
    Clay: "Glina",
    Digital: "Cyfrowość",
} as const

type TagName = keyof typeof tagNamesPln

const tagIdByName = Object.fromEntries(
    Object.keys(tagNamesPln).map((name, index) => [
        name,
        `a7f3bc01-0000-4000-8000-0000000003${String(index + 1).padStart(2, "0")}`,
    ])
) as Record<TagName, string>

type SeedPhoto = { mediaId: string; file: string }

type SeedArtwork = {
    artPieceId: string
    titlePln: string
    titleEng: string
    categoryId: string
    yearOfExecution: number
    tags: TagName[]
    /** The first photo is the cover. */
    photos: SeedPhoto[]
}

// Covers keep their fixed ids (the bento layout points at them); every other photo is numbered
// from ...601 in the order the artworks are listed.
let extraMediaNumber = 600
const extraPhoto = (file: string): SeedPhoto => ({
    mediaId: `a7f3bc01-0000-4000-8000-${String(++extraMediaNumber).padStart(12, "0")}`,
    file,
})

const sampleFiles = [
    "sample/group-13-1.jpg",
    "sample/group-13-2.jpg",
    "sample/group-13-3.png",
    "sample/group-13-4.jpg",
    "sample/group-13-5.png",
    "sample/group-13-6.png",
    "sample/group-13-7.jpg",
]

/** A sample work: its own image as the cover, then the next two sample images. */
function sampleArtwork(
    index: number,
    titleEng: string,
    categoryId: string,
    yearOfExecution: number,
    tags: TagName[]
): SeedArtwork {
    const number = String(index + 1)
    return {
        artPieceId: `a7f3bc01-0000-4000-8000-00000000010${number}`,
        titlePln: `${titleEng} (PL)`,
        titleEng,
        categoryId,
        yearOfExecution,
        tags,
        photos: [
            { mediaId: `a7f3bc01-0000-4000-8000-00000000020${number}`, file: sampleFiles[index] },
            extraPhoto(sampleFiles[(index + 1) % sampleFiles.length]),
            extraPhoto(sampleFiles[(index + 2) % sampleFiles.length]),
        ],
    }
}

const breakwaterNumerals = ["I", "II", "III", "IV", "V"]

/** The 20 breakwater photos split into five works of four photos each. */
function breakwaterArtwork(part: number): SeedArtwork {
    const [cover, ...rest] = [1, 2, 3, 4].map(
        (photo) => `anatomia-falochronu/${part * 4 + photo}.jpg`
    )
    return {
        artPieceId: `a7f3bc01-0000-4000-8000-0000000001${String(8 + part).padStart(2, "0")}`,
        titlePln: `Anatomia falochronu ${breakwaterNumerals[part]}`,
        titleEng: `Anatomy of the Breakwater ${breakwaterNumerals[part]}`,
        categoryId: categoryIds.photography,
        yearOfExecution: 2025,
        tags: ["Photography", "Stone", "Sea"],
        photos: [
            {
                mediaId: `a7f3bc01-0000-4000-8000-0000000002${String(8 + part).padStart(2, "0")}`,
                file: cover,
            },
            ...rest.map(extraPhoto),
        ],
    }
}

const artworks: SeedArtwork[] = [
    sampleArtwork(0, "Campaign “Spring in the City”", categoryIds.design, 2025, ["Marble"]),
    sampleArtwork(1, "Spring in the City", categoryIds.painting, 2026, ["Watercolor"]),
    sampleArtwork(2, "Painting", categoryIds.painting, 2024, ["Watercolor"]),
    sampleArtwork(3, "Sculpture", categoryIds.sculpture, 2023, ["Brass"]),
    sampleArtwork(4, "Identity Rebranding", categoryIds.design, 2024, ["Poster"]),
    sampleArtwork(5, "FinTech Application Design", categoryIds.design, 2025, ["Glass"]),
    sampleArtwork(6, "Organic Identity", categoryIds.art, 2026, [
        "Oil",
        "Still Life",
        "Flowers",
        "Classical",
    ]),
    ...breakwaterNumerals.map((_, part) => breakwaterArtwork(part)),
    {
        artPieceId: "a7f3bc01-0000-4000-8000-000000000113",
        titlePln: "Cyfrowa ucieczka",
        titleEng: "Digital Escape",
        categoryId: categoryIds.sculpture,
        yearOfExecution: 2025,
        tags: ["Clay", "Digital"],
        photos: [
            { mediaId: "a7f3bc01-0000-4000-8000-000000000213", file: "cyfrowa-ucieczka/1.jpg" },
            ...[2, 3, 4, 5, 6].map((photo) => extraPhoto(`cyfrowa-ucieczka/${photo}.jpg`)),
        ],
    },
]

const sampleTexts = {
    dimensions: "70 x 100 cm",
    miniDescription: {
        paragraphs: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit."],
    },
    description: {
        technique:
            "<b>Lorem ipsum dolor sit amet</b>, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        description:
            "Ut enim ad minim veniam, quis nostrud <i>exercitation ullamco laboris</i> nisi ut aliquip ex ea commodo consequat.",
    },
}

async function main() {
    const seedOptions = parseSeedArguments(process.argv.slice(2))
    console.log("Seeding database...")

    const { db } = await import("./index")
    const { categories, tags, artPieces, media, artPieceTags, users } = await import("./schema")

    // The home page shows the cover of each of the first seven works.
    const layout = buildBentoLayout(
        artworks.slice(0, 7).map(({ artPieceId, photos }) => ({
            artPieceId,
            mediaId: photos[0].mediaId,
        }))
    )

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

        const profileContent = await readFile(path.join(fixtureDirectory, "sample", "profile.jpg"))
        await seedArtistProfile(tx, profileContent)
        await seedSocialLinks(tx)

        await tx.insert(categories).values(categoryRows).onConflictDoNothing()

        await tx
            .insert(tags)
            .values(
                (Object.keys(tagNamesPln) as TagName[]).map((name) => ({
                    tagId: tagIdByName[name],
                    nameEng: name,
                    namePln: tagNamesPln[name],
                }))
            )
            .onConflictDoNothing()

        for (const artwork of artworks) {
            await tx
                .insert(artPieces)
                .values({
                    artPieceId: artwork.artPieceId,
                    categoryId: artwork.categoryId,
                    titlePln: artwork.titlePln,
                    titleEng: artwork.titleEng,
                    dimensions: sampleTexts.dimensions,
                    miniDescriptionPln: sampleTexts.miniDescription,
                    miniDescriptionEng: sampleTexts.miniDescription,
                    descriptionPln: sampleTexts.description,
                    descriptionEng: sampleTexts.description,
                    yearOfExecution: artwork.yearOfExecution,
                    isVisible: true,
                })
                .onConflictDoNothing()

            for (const [orderIndex, photo] of artwork.photos.entries()) {
                const content = await readFile(path.join(fixtureDirectory, photo.file))
                await tx
                    .insert(media)
                    .values({
                        mediaId: photo.mediaId,
                        artPieceId: artwork.artPieceId,
                        content,
                        contentHash: createHash("sha256").update(content).digest("hex"),
                        fileType: path.extname(photo.file).slice(1) as "png" | "jpg",
                        orderIndex,
                    })
                    .onConflictDoNothing()
            }

            await tx
                .insert(artPieceTags)
                .values(
                    artwork.tags.map((name) => ({
                        artPieceId: artwork.artPieceId,
                        tagId: tagIdByName[name],
                    }))
                )
                .onConflictDoNothing()
        }

        await seedSiteSettings(tx, layout)
    })

    console.log(
        `Database seeded successfully with ${artworks.length} works in ${categoryRows.length} categories!`
    )
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Failed to seed database:", err)
        process.exit(1)
    })
