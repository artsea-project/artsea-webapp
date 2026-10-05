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
    console.log("Seeding database with real sample data...")

    const { db } = await import("./index")
    const { categories, tags, artPieces, media, artPieceTags, users } = await import("./schema")

    const photographyCategoryId = "a7f3bc01-0000-4000-8000-000000000002"
    const sculptureCategoryId = "a7f3bc01-0000-4000-8000-000000000005"
    const fixtureDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures")

    const artworksConfig = {
        breakwater: {
            id: "a7f3bc01-0000-4000-8000-000000000101",
            folder: "anatomia-falochronu",
            photoCount: 20,
            mediaIdPrefix: "a7f3bc01-0000-4000-8000-0000000002",
        },
        digitalEscape: {
            id: "a7f3bc01-0000-4000-8000-000000000102",
            folder: "cyfrowa-ucieczka",
            photoCount: 6,
            mediaIdPrefix: "a7f3bc01-0000-4000-8000-0000000004",
        },
    } as const

    const mediaIdFor = (piece: { mediaIdPrefix: string }, photoNumber: number) =>
        `${piece.mediaIdPrefix}${String(photoNumber).padStart(2, "0")}`

    const breakwaterArtPieceId = artworksConfig.breakwater.id
    const digitalEscapeArtPieceId = artworksConfig.digitalEscape.id

    const breakwaterDescPln = {
        technique: "Fotografia",
        description:
            "Trafiłam w to miejsce przez czysty przypadek. Zwykły postój na szybki posiłek w drodze wzdłuż wybrzeża w Santa Marinella nieoczekiwanie zamienił się w cztery godziny hipnotyzującej obserwacji. Moją uwagę przyciągnął zewnętrzny falochron małego portu jachtowego — z pozoru surowa, użytkowa konstrukcja z betonu, stworzona by rozbijać fale Morza Tyrreńskiego.<br /><br />Umacniające ją potężne bryły skalne okazały się studium wzorów, kolorów i struktur. Wielobarwne warstwy, gęsta sieć mineralnych żył i ślady milionów lat procesów geologicznych zderzone z chłodną wodą morza. Ta seria to studium ukrytego detalu — anatomia kamienia, który z twardego elementu inżynierii nabrzeżnej staje się surową, abstrakcyjną opowieścią o czasie, wodzie i materii.<br /><br />Zdjęcia bez filtrów i zmiany kolorów.",
    }

    const breakwaterDescEng = {
        technique: "Photography",
        description:
            "Coming across this place was pure chance. A brief stop for a quick meal along the coast of Santa Marinella unexpectedly turned into four hours of mesmerized observation. What caught my eye was the outer breakwater of the small marina—at first glance, a raw, utilitarian concrete structure built solely to shatter the waves of the Tyrrhenian Sea.<br /><br />Yet the massive stone blocks reinforcing it proved to be a study in patterns, colors, and textures. Multicolored strata, a dense network of mineral veins, and traces of millions of years of geological history colliding with the cool sea water. This series is a study of hidden detail—the anatomy of stone that shifts from a rigid element of coastal engineering into a raw, abstract tale of time, water, and matter.<br /><br />No filters nor color enhancements were applied on the photos.",
    }

    const digitalEscapeDescPln = {
        technique: "Glina szkliwiona",
        description:
            'Ekran tabletu to współczesna piąta ściana obecna w niemalże każdym pomieszczeniu – bariera dzieląca świat fizyczny od wirtualnego. Jest to gładka, jednolita, chłodna powierzchnia, która daje człowiekowi złudne poczucie bezpieczeństwa i kontroli. Z czasem, niezauważalnie ekran staje się mentalną pułapką, a wyświetlane obrazy są coraz mniej zbliżone do rzeczywistości w jakiej żyjesz, stąd w rzeźbie ekran stracił już cechy lustrzane.<br /><br />Rzeźba "Cyfrowa ucieczka" ukazuje dramatyczny moment przełamywania cyfrowej bariery przez człowieka.<br /><br />Możliwe, że to akt walki - dłoń z determinacją rozbija ekran, symbolizując przełamanie uzależnienia i próbę powrotu do świata realnego.<br /><br />Możliwe, że to wołanie o pomoc - otwarta, skierowana ku górze ręka przypomina gest tonącego, który w ostatniej chwili próbuje się czegoś złapać, nim zostanie całkowicie pochłonięty przez cyfrową otchłań.<br /><br />Czy "Cyfrowa ucieczka" jest ucieczką do cyfrowego świata, czy z cyfrowego świata?',
    }

    const digitalEscapeDescEng = {
        technique: "Glazed clay",
        description:
            'The tablet screen is the modern fifth wall present in nearly every room - a barrier separating the physical world from the virtual. It is a smooth, uniform, cold surface that offers a false sense of security and control. Over time, almost unnoticed, the screen turns into a mental trap, and the displayed images drift ever further from the reality you inhabit; hence, in this sculpture, the screen has already lost its mirror-like quality.<br /><br />The sculpture captures a dramatic moment of a human breaking through the digital barrier.<br /><br />It may be an act of resistance - the hand strikes through the screen with determination, symbolizing a breakthrough against addiction and a bid to return to the real world.<br /><br />It may be a cry for help - open and reaching upward, the hand resembles the gesture of a drowning person grasping for anything in the final second before being entirely swallowed by the digital abyss.<br /><br />Is "Digital escape" an escape into the digital world, or an escape from it?',
    }

    const tagDefs = [
        {
            id: "a7f3bc01-0000-4000-8000-000000000301",
            namePln: "fotografia",
            nameEng: "photography",
        },
        {
            id: "a7f3bc01-0000-4000-8000-000000000302",
            namePln: "kamień",
            nameEng: "stones",
        },
        {
            id: "a7f3bc01-0000-4000-8000-000000000303",
            namePln: "rzeźba",
            nameEng: "sculpture",
        },
        {
            id: "a7f3bc01-0000-4000-8000-000000000304",
            namePln: "glina",
            nameEng: "clay",
        },
        {
            id: "a7f3bc01-0000-4000-8000-000000000305",
            namePln: "uzależnienie cyfrowe",
            nameEng: "digital addiction",
        },
    ] as const

    const bentoItems = [
        {
            artPieceId: digitalEscapeArtPieceId,
            mediaId: mediaIdFor(artworksConfig.digitalEscape, 1),
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: mediaIdFor(artworksConfig.breakwater, 1),
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: mediaIdFor(artworksConfig.breakwater, 2),
        },
        {
            artPieceId: digitalEscapeArtPieceId,
            mediaId: mediaIdFor(artworksConfig.digitalEscape, 2),
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: mediaIdFor(artworksConfig.breakwater, 3),
        },
        {
            artPieceId: digitalEscapeArtPieceId,
            mediaId: mediaIdFor(artworksConfig.digitalEscape, 3),
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: mediaIdFor(artworksConfig.breakwater, 4),
        },
    ]

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
            .values([
                {
                    categoryId: photographyCategoryId,
                    namePln: "Kolekcja fotografii",
                    nameEng: "Collection of photographs",
                },
                {
                    categoryId: sculptureCategoryId,
                    namePln: "Rzeźba",
                    nameEng: "Sculpture",
                },
            ])
            .onConflictDoNothing()

        await tx
            .insert(tags)
            .values(
                tagDefs.map((tag) => ({
                    tagId: tag.id,
                    namePln: tag.namePln,
                    nameEng: tag.nameEng,
                }))
            )
            .onConflictDoNothing()

        await tx
            .insert(artPieces)
            .values([
                {
                    artPieceId: breakwaterArtPieceId,
                    categoryId: photographyCategoryId,
                    titlePln: "Anatomia Falochronu. Antemurale Porticciolo de Santa Marinella",
                    titleEng:
                        "Anatomy of the Breakwater. Antemurale Porticciolo de Santa Marinella",
                    dimensions: null,
                    yearOfExecution: 2025,
                    isVisible: true,
                    miniDescriptionPln: null,
                    miniDescriptionEng: null,
                    descriptionPln: breakwaterDescPln,
                    descriptionEng: breakwaterDescEng,
                },
                {
                    artPieceId: digitalEscapeArtPieceId,
                    categoryId: sculptureCategoryId,
                    titlePln: "Cyfrowa ucieczka",
                    titleEng: "Digital Escape",
                    dimensions: null,
                    yearOfExecution: 2025,
                    isVisible: true,
                    miniDescriptionPln: null,
                    miniDescriptionEng: null,
                    descriptionPln: digitalEscapeDescPln,
                    descriptionEng: digitalEscapeDescEng,
                },
            ])
            .onConflictDoNothing()

        await tx
            .insert(artPieceTags)
            .values([
                { artPieceId: breakwaterArtPieceId, tagId: tagDefs[0].id },
                { artPieceId: breakwaterArtPieceId, tagId: tagDefs[1].id },
                { artPieceId: digitalEscapeArtPieceId, tagId: tagDefs[2].id },
                { artPieceId: digitalEscapeArtPieceId, tagId: tagDefs[3].id },
                { artPieceId: digitalEscapeArtPieceId, tagId: tagDefs[4].id },
            ])
            .onConflictDoNothing()

        for (const artwork of Object.values(artworksConfig)) {
            for (let i = 1; i <= artwork.photoCount; i++) {
                const mediaId = mediaIdFor(artwork, i)
                const filePath = path.join(fixtureDirectory, artwork.folder, `${i}.jpg`)
                const content = await readFile(filePath)

                await tx
                    .insert(media)
                    .values({
                        mediaId,
                        artPieceId: artwork.id,
                        content,
                        contentHash: createHash("sha256").update(content).digest("hex"),
                        fileType: "jpg",
                        orderIndex: i - 1,
                    })
                    .onConflictDoNothing()
            }
        }

        await seedSiteSettings(tx, layout)
    })

    console.log("Database seeded successfully with real portfolio data!")
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Failed to seed database:", err)
        process.exit(1)
    })
