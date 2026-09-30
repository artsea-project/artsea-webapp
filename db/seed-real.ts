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
    console.log("Seeding database with real sample data...")

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

    const photographyCategoryId = "a7f3bc01-0000-4000-8000-000000000002"
    const sculptureCategoryId = "a7f3bc01-0000-4000-8000-000000000005"
    const profileId = "a7f3bc01-0000-4000-8000-000000000003"
    const siteSettingsId = "a7f3bc01-0000-4000-8000-000000000004"
    const fixtureDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures")

    const breakwaterArtPieceId = "a7f3bc01-0000-4000-8000-000000000101"
    const digitalEscapeArtPieceId = "a7f3bc01-0000-4000-8000-000000000102"

    const breakwaterDescPln = {
        technique: "fotografia",
        description:
            "Trafiłam w to miejsce przez czysty przypadek. Zwykły postój na szybki posiłek w drodze wzdłuż wybrzeża w Santa Marinella nieoczekiwanie zamienił się w cztery godziny hipnotyzującej obserwacji. Moją uwagę przyciągnął zewnętrzny falochron małego portu jachtowego — z pozoru surowa, użytkowa konstrukcja z betonu, stworzona by rozbijać fale Morza Tyrreńskiego.<br /><br />Umacniające ją potężne bryły skalne okazały się studium wzorów, kolorów i struktur. Wielobarwne warstwy, gęsta sieć mineralnych żył i ślady milionów lat procesów geologicznych zderzone z chłodną wodą morza. Ta seria to studium ukrytego detalu — anatomia kamienia, który z twardego elementu inżynierii nabrzeżnej staje się surową, abstrakcyjną opowieścią o czasie, wodzie i materii.<br /><br />Zdjęcia bez filtrów i zmiany kolorów.",
    }

    const breakwaterDescEng = {
        technique: "photography",
        description:
            "Coming across this place was pure chance. A brief stop for a quick meal along the coast of Santa Marinella unexpectedly turned into four hours of mesmerized observation. What caught my eye was the outer breakwater of the small marina—at first glance, a raw, utilitarian concrete structure built solely to shatter the waves of the Tyrrhenian Sea.<br /><br />Yet the massive stone blocks reinforcing it proved to be a study in patterns, colors, and textures. Multicolored strata, a dense network of mineral veins, and traces of millions of years of geological history colliding with the cool sea water. This series is a study of hidden detail—the anatomy of stone that shifts from a rigid element of coastal engineering into a raw, abstract tale of time, water, and matter.<br /><br />No filters nor color enhancements were applied on the photos.",
    }

    const digitalEscapeDescPln = {
        technique: "glina szkliwiona",
        description:
            'Ekran tabletu to współczesna piąta ściana obecna w niemalże każdym pomieszczeniu – bariera dzieląca świat fizyczny od wirtualnego. Jest to gładka, jednolita, chłodna powierzchnia, która daje człowiekowi złudne poczucie bezpieczeństwa i kontroli. Z czasem, niezauważalnie ekran staje się mentalną pułapką, a wyświetlane obrazy są coraz mniej zbliżone do rzeczywistości w jakiej żyjesz, stąd w rzeźbie ekran stracił już cechy lustrzane.<br /><br />Rzeźba "Cyfrowa ucieczka" ukazuje dramatyczny moment przełamywania cyfrowej bariery przez człowieka.<br /><br />Możliwe, że to akt walki - dłoń z determinacją rozbija ekran, symbolizując przełamanie uzależnienia i próbę powrotu do świata realnego.<br /><br />Możliwe, że to wołanie o pomoc - otwarta, skierowana ku górze ręka przypomina gest tonącego, który w ostatniej chwili próbuje się czegoś złapać, nim zostanie całkowicie pochłonięty przez cyfrową otchłań.<br /><br />Czy "Cyfrowa ucieczka" jest ucieczką do cyfrowego świata, czy z cyfrowego świata?',
    }

    const digitalEscapeDescEng = {
        technique: "glazed clay",
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
            mediaId: "a7f3bc01-0000-4000-8000-000000000401",
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: "a7f3bc01-0000-4000-8000-000000000201",
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: "a7f3bc01-0000-4000-8000-000000000202",
        },
        {
            artPieceId: digitalEscapeArtPieceId,
            mediaId: "a7f3bc01-0000-4000-8000-000000000402",
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: "a7f3bc01-0000-4000-8000-000000000203",
        },
        {
            artPieceId: digitalEscapeArtPieceId,
            mediaId: "a7f3bc01-0000-4000-8000-000000000403",
        },
        {
            artPieceId: breakwaterArtPieceId,
            mediaId: "a7f3bc01-0000-4000-8000-000000000204",
        },
    ] as const

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
            items: bentoItems.map((item, index) => ({
                artPieceId: item.artPieceId,
                mediaId: item.mediaId,
                columnStart: desktop[index][0],
                rowStart: desktop[index][1],
                columnSpan: desktop[index][2],
                rowSpan: desktop[index][3],
            })),
        },
        mobile: {
            items: bentoItems.map((item, index) => ({
                artPieceId: item.artPieceId,
                mediaId: item.mediaId,
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
        await tx.delete(artPieceTags)
        await tx.delete(media)
        await tx.delete(links)
        await tx.delete(profiles)
        await tx.delete(artPieces)
        await tx.delete(tags)
        await tx.delete(categories)
        await tx.delete(siteSettings)
        await tx.delete(users)

        await tx
            .insert(users)
            .values({ ...seedArtist, passwordHash: "development-only-not-for-login" })
            .onConflictDoNothing()

        const profileContent = await readFile(path.join(fixtureDirectory, "profile.jpg"))
        await tx
            .insert(profiles)
            .values({
                profileId,
                fullName: "Élise Roux",
                bioPln: {
                    paragraphs: [
                        "Tworzę ilustracje i identyfikacje wizualne, łącząc organiczne formy z minimalistyczną precyzją. Działam w Gdańsku, inspirując się naturą i surową architekturą.",
                        "Cześć! Nazywam się Anna i jestem niezależną ilustratorką z Gdańska. Od ponad siedmiu lat pomagam markom tworzyć czystą, przemyślaną identyfikację.",
                        "Moja przygoda ze sztuką zaczęła się od tradycyjnego malarstwa, które nauczyło mnie szacunku do światła i barwy. Szybko jednak odkryłam, że cyfrowe płótno daje równie wielkie możliwości wyrazu. Dziś specjalizuję się w łączeniu geometrycznego rygoru z ciepłem organicznych kształtów.",
                        "Współpracowałam z wieloma instytucjami kultury, wydawnictwami i niezależnymi twórcami. Najbardziej cenię sobie projekty, które wymagają nieszablonowego myślenia oraz głębokiego wejścia w kontekst tworzonej opowieści.",
                    ],
                },
                bioEng: {
                    paragraphs: [
                        "I create illustrations and visual identities, combining organic forms with minimalist precision. I work in Gdańsk, drawing inspiration from nature and raw architecture.",
                        "Hi! My name is Anna and I am an independent illustrator based in Gdańsk. For over seven years I have been helping brands create clean, thoughtful identities.",
                        "My adventure with art began with traditional painting, which taught me respect for light and color. However, I quickly discovered that the digital canvas offers equally great possibilities of expression. Today, I specialize in combining geometric rigor with the warmth of organic shapes.",
                        "I have collaborated with many cultural institutions, publishing houses, and independent creators. I value projects that require out-of-the-box thinking and a deep dive into the context of the story being created.",
                    ],
                },
                contactPln: {
                    paragraphs: [
                        "Jeśli podoba Ci się moje podejście do designu, napisz do mnie.",
                        "Zawsze jestem otwarta na nowe, interesujące wyzwania.",
                    ],
                },
                contactEng: {
                    paragraphs: [
                        "If you like my approach to design, feel free to write to me.",
                        "I am always open to new, interesting challenges.",
                    ],
                },
                profileImageContent: profileContent,
                profileImageContentHash: createHash("sha256").update(profileContent).digest("hex"),
                profileImageFileType: "jpg",
            })
            .onConflictDoNothing()

        await tx
            .insert(links)
            .values([
                { name: "instagram", url: "https://instagram.com/elise_roux" },
                { name: "behance", url: "https://behance.net/elise_roux" },
            ])
            .onConflictDoNothing()

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

        for (let i = 1; i <= 20; i++) {
            const mediaId = `a7f3bc01-0000-4000-8000-0000000002${String(i).padStart(2, "0")}`
            const filePath = path.join(fixtureDirectory, "anatomia-falochronu", `${i}.jpg`)
            const content = await readFile(filePath)

            await tx
                .insert(media)
                .values({
                    mediaId,
                    artPieceId: breakwaterArtPieceId,
                    content,
                    contentHash: createHash("sha256").update(content).digest("hex"),
                    fileType: "jpg",
                    orderIndex: i - 1,
                })
                .onConflictDoNothing()
        }

        for (let i = 1; i <= 6; i++) {
            const mediaId = `a7f3bc01-0000-4000-8000-0000000004${String(i).padStart(2, "0")}`
            const filePath = path.join(fixtureDirectory, "cyfrowa-ucieczka", `${i}.jpg`)
            const content = await readFile(filePath)

            await tx
                .insert(media)
                .values({
                    mediaId,
                    artPieceId: digitalEscapeArtPieceId,
                    content,
                    contentHash: createHash("sha256").update(content).digest("hex"),
                    fileType: "jpg",
                    orderIndex: i - 1,
                })
                .onConflictDoNothing()
        }

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

    console.log("Database seeded successfully with real portfolio data!")
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Failed to seed database:", err)
        process.exit(1)
    })
