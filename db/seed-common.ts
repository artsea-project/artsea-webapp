import { createHash } from "node:crypto"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { BentoBoxLayout } from "../types/bento"
import type { SiteTheme } from "../types/theme"
import { defaultSiteTheme } from "@/lib/theme/theme"
import * as schema from "./schema"
import {
    artPieces,
    artPieceTags,
    categories,
    links,
    media,
    profiles,
    siteSettings,
    tags,
    users,
} from "./schema"
import { seedArtist } from "./seed-guard"

export type SeedTransaction = Parameters<
    Parameters<NodePgDatabase<typeof schema>["transaction"]>[0]
>[0]

export const profileId = "a7f3bc01-0000-4000-8000-000000000003"
export const siteSettingsId = "a7f3bc01-0000-4000-8000-000000000004"

export const sharedProfile = {
    profileId,
    fullName: "Niebajka",
    contactEmail: "niebajka@gmail.com",
    bioPln: {
        heading: "Ukształtowana w trudzie",
        intro: [
            "Po co jest cierpienie, jeżeli nie może zostać przekształcone w sztukę? Uważam że prawdziwe dzieła rodzą się w trudzie - w trudzie walki z materią, ale też w trudzie walki ze sobą i przeciwnościami życia. Dlatego tworzę. A raczej coś we mnie poprzez sztukę wyrywa się na zewnątrz…",
            "Ukształtowana w trudzie… moja sztuka i ja sama.",
        ],
        highlight: [
            "Tworzę pod pseudonimem Niebajka (czyt. Nye-bye-kah). Nazwa ta jest inspirowana piosenką Łukasza Majewskiego, która w zaledwie trzy minuty oddaje historię mojego życia i moje spojrzenie na świat.",
        ],
        body: [
            "Moja przygoda ze sztuką - a konkretnie z rzeźbą - zaczęła się dość późno. Gdy moje dzieci były w szkole podstawowej, zaprosiły mnie na dzień otwarty, a w szczególności na warsztaty ceramiczne. Spędziłam tam parę godzin, zmagając się z gliną, i uświadomiłam sobie, że były to najprzyjemniejsze godziny od bardzo dawna. Walka z materią pozwoliła mi oderwać się od codzienności.",
            "Zaczęłam wtedy lepić postać - skuloną, obejmującą się ramionami. Siedzące obok dziecko zapytało swoją mamę, wskazując na moją pracę: „Mamo, czy tę panią boli brzuch?”. Na co mama odpowiedziała: „Nie, to jest ból istnienia”. W tym momencie dotarło do mnie, że pomimo braku doświadczenia i niedoskonałości warsztatu udało mi się przekazać dokładnie to, co czułam.",
            "To doświadczenie dało mi ogromną siłę. Postanowiłam uczyć się dalej: najpierw w pracowni Marzeny Gawrysiak, a później u Oleny Dodatko w Gdańskiej Szkole Artystycznej.",
            "Rzeźbię przede wszystkim człowieka. Nawet kiedy próbuję stworzyć zwykłe pudełko, jego pokrywka ostatecznie zyskuje kształt twarzy; gdy lepię talerz, zawsze pojawia się na nim sylwetka. Moje rzeźby są głęboko osobiste i pełne emocji - wyrastają wprost z moich przeżyć i zmagania z życiem.",
        ],
    },
    bioEng: {
        heading: "Shaped by struggle",
        intro: [
            "What is suffering for, if it cannot be turned into art? I believe that true masterpieces are born of struggle - the struggle against matter, but also against oneself and the adversities of life. That is why I create. Or rather, something within me breaks through to the surface through art…",
            "Shaped by struggle… my art, and myself.",
        ],
        highlight: [
            "I create under the name Niebajka (pronounced Nye-bye-kah, meaning unfairytale). The name is inspired by a song by Łukasz Majewski, which captures my life story and outlook on the world in just three minutes",
        ],
        body: [
            "My journey with art - specifically with sculpture - began quite late in life. When my children were in primary school, they invited me to their school’s open day, and in particular to a ceramics workshop. I spent a couple of hours wrestling with clay and realized those were the most enjoyable hours I had experienced in a very long time. Wrestling with the physical medium gave me a much-needed break from the weight of everyday life.",
            "During the workshop, I began sculpting a figure - curled up, wrapping its arms around itself. A child sitting nearby pointed at my work and asked their mother, “Mom, does this lady have a stomachache?”. To which the mother replied, “No, that is the pain of existence.” In that moment, I realized that despite my lack of experience and untrained hands, I had managed to convey exactly what I felt inside.",
            "That experience was immensely empowering. I decided to pursue it further, taking lessons first in Marzena Gawrysiak’s studio, and later with Olena Dodatko at the Gdańsk School of Art (Gdańska Szkoła Artystyczna).",
            "Above all, I sculpt the human form. Even when I try to make a simple box, the lid inevitably takes the shape of a face; when I shape a plate, a silhouette always emerges. My sculptures are deeply personal and emotional - born directly out of my own experiences and life’s struggles.",
        ],
    },
    contactPln: {
        paragraphs: [
            "Poruszyła Cię moja praca? Chcesz zapytać o daną rzeźbę lub po prostu porozmawiać o sztuce? Napisz do mnie.",
        ],
    },
    contactEng: {
        paragraphs: [
            "Did a piece resonate with you? Whether you're interested in a sculpture or simply a conversation about art, feel free to reach out.",
        ],
    },
}

export const sharedSocialLinks = [
    { name: "Instagram", url: "https://instagram.com/anna" },
    { name: "Behance", url: "https://behance.net/anna" },
]

export const defaultTheme: SiteTheme = defaultSiteTheme

export type BentoSeedItem = {
    artPieceId: string
    mediaId: string
}

// [columnStart, rowStart, columnSpan, rowSpan] in cells on the 12 x 9 desktop and 6-column mobile
// grids. Every tile is a preset (1:1, 2:1, 1:2, 2:2) on 3 x 3 cell fields.
const desktopCoordinates = [
    [1, 1, 3, 6],
    [4, 1, 3, 3],
    [4, 4, 3, 3],
    [7, 1, 6, 6],
    [1, 7, 6, 3],
    [7, 7, 3, 3],
    [10, 7, 3, 3],
] as const

const mobileCoordinates = [
    [1, 1, 3, 6],
    [4, 1, 3, 3],
    [4, 4, 3, 3],
    [1, 7, 6, 6],
    [1, 13, 6, 3],
    [1, 16, 3, 3],
    [4, 16, 3, 3],
] as const

const bentoTileIds = [
    "a7f3bc01-0000-4000-8000-000000000501",
    "a7f3bc01-0000-4000-8000-000000000502",
    "a7f3bc01-0000-4000-8000-000000000503",
    "a7f3bc01-0000-4000-8000-000000000504",
    "a7f3bc01-0000-4000-8000-000000000505",
    "a7f3bc01-0000-4000-8000-000000000506",
    "a7f3bc01-0000-4000-8000-000000000507",
] as const

export function buildBentoLayout(bentoItems: readonly BentoSeedItem[]): BentoBoxLayout {
    return {
        desktop: {
            items: bentoItems.map((item, index) => ({
                tileId: bentoTileIds[index],
                artPieceId: item.artPieceId,
                mediaId: item.mediaId,
                columnStart: desktopCoordinates[index][0],
                rowStart: desktopCoordinates[index][1],
                columnSpan: desktopCoordinates[index][2],
                rowSpan: desktopCoordinates[index][3],
            })),
        },
        mobile: {
            items: bentoItems.map((item, index) => ({
                tileId: bentoTileIds[index],
                artPieceId: item.artPieceId,
                mediaId: item.mediaId,
                columnStart: mobileCoordinates[index][0],
                rowStart: mobileCoordinates[index][1],
                columnSpan: mobileCoordinates[index][2],
                rowSpan: mobileCoordinates[index][3],
            })),
        },
    }
}

export async function cleanDatabase(tx: SeedTransaction) {
    await tx.delete(artPieceTags)
    await tx.delete(media)
    await tx.delete(links)
    await tx.delete(profiles)
    await tx.delete(artPieces)
    await tx.delete(tags)
    await tx.delete(categories)
    await tx.delete(siteSettings)
    await tx.delete(users)
}

export async function seedArtistUser(tx: SeedTransaction) {
    await tx
        .insert(users)
        .values({ ...seedArtist, passwordHash: "development-only-not-for-login" })
        .onConflictDoNothing()
}

export async function seedArtistProfile(tx: SeedTransaction, profileContent: Buffer) {
    await tx
        .insert(profiles)
        .values({
            ...sharedProfile,
            profileImageContent: profileContent,
            profileImageContentHash: createHash("sha256").update(profileContent).digest("hex"),
            profileImageFileType: "jpg",
        })
        .onConflictDoNothing()
}

export async function seedSocialLinks(tx: SeedTransaction) {
    await tx.insert(links).values(sharedSocialLinks).onConflictDoNothing()
}

export async function seedSiteSettings(
    tx: SeedTransaction,
    layout: BentoBoxLayout,
    theme: SiteTheme = defaultTheme
) {
    await tx
        .insert(siteSettings)
        .values({ siteSettingsId, theme, layoutBentoBox: layout })
        .onConflictDoNothing()
}
