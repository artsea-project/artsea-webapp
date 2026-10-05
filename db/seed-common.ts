import { createHash } from "node:crypto"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { BentoBoxLayout } from "../types/bento"
import type { SiteTheme } from "../types/theme"
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
}

export const sharedSocialLinks = [
    { name: "instagram", url: "https://instagram.com/elise_roux" },
    { name: "behance", url: "https://behance.net/elise_roux" },
]

export const defaultTheme: SiteTheme = {
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

export type BentoSeedItem = {
    artPieceId: string
    mediaId: string
}

const desktopCoordinates = [
    [1, 1, 4, 10],
    [5, 1, 3, 5],
    [5, 6, 3, 5],
    [8, 1, 4, 10],
    [1, 11, 3, 7],
    [4, 11, 4, 7],
    [8, 11, 4, 7],
] as const

const mobileCoordinates = [
    [1, 1, 1, 8],
    [2, 1, 1, 5],
    [2, 6, 1, 3],
    [1, 9, 2, 8],
    [1, 17, 1, 6],
    [2, 17, 1, 6],
    [1, 23, 2, 8],
] as const

export function buildBentoLayout(bentoItems: readonly BentoSeedItem[]): BentoBoxLayout {
    return {
        desktop: {
            items: bentoItems.map((item, index) => ({
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
