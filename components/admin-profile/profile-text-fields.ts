import type { BilingualFieldCopy } from "@/components/admin-profile/BilingualTextField"
import { DEFAULT_ABOUT_HEADING } from "@/lib/profile/content"

export const bioHeadingFieldCopy: BilingualFieldCopy = {
    id: "bioHeading",
    label: "Nagłówek / Heading",
    inputNames: { pln: "bioHeadingPln", eng: "bioHeadingEng" },
    placeholders: DEFAULT_ABOUT_HEADING,
    description: `Pojawi się pod imieniem, nad wprowadzeniem. Puste pole pokaże „${DEFAULT_ABOUT_HEADING.pln}”.`,
}

export const bioIntroFieldCopy: BilingualFieldCopy = {
    id: "bioIntro",
    label: "Wprowadzenie / Introduction",
    inputNames: { pln: "bioIntroPln", eng: "bioIntroEng" },
    placeholders: {
        pln: "Krótko o sobie, np. czym się zajmujesz i skąd jesteś.",
        eng: "A few words about yourself, e.g. what you do and where you are from.",
    },
    description: "Pojawi się na górze strony O mnie, obok zdjęcia.",
    rows: 3,
}

export const bioHighlightFieldCopy: BilingualFieldCopy = {
    id: "bioHighlight",
    label: "Wyróżniony fragment / Highlight",
    inputNames: { pln: "bioHighlightPln", eng: "bioHighlightEng" },
    placeholders: {
        pln: "Myśl, która najlepiej opisuje Twoją twórczość.",
        eng: "A thought that best describes your work.",
    },
    description: "Otwiera kolejną sekcję strony, większą czcionką.",
    rows: 3,
}

export const bioBodyFieldCopy: BilingualFieldCopy = {
    id: "bioBody",
    label: "Dalsza część / Full story",
    inputNames: { pln: "bioBodyPln", eng: "bioBodyEng" },
    placeholders: {
        pln: [
            "Dalsza część biogramu, np. o Twojej drodze, technikach i współpracach.",
            "Akapity oddzielaj pustą linią, jak w tym przykładzie.",
        ].join("\n\n"),
        eng: [
            "The rest of your bio, e.g. your path, techniques and collaborations.",
            "Separate paragraphs with a blank line, as in this example.",
        ].join("\n\n"),
    },
    description: "Pojawi się obok wyróżnionego fragmentu.",
    rows: 8,
}

export const contactFieldCopy: BilingualFieldCopy = {
    id: "contact",
    label: "Kontakt / Contact",
    inputNames: { pln: "contactPln", eng: "contactEng" },
    placeholders: {
        pln: [
            "Krótka zachęta do kontaktu, np. w jakich projektach chętnie pomożesz.",
            "Akapity oddzielaj pustą linią. Puste pole ukryje ten tekst na stronie.",
        ].join("\n\n"),
        eng: [
            "A short invitation to get in touch, e.g. which projects you are happy to help with.",
            "Separate paragraphs with a blank line. An empty field hides this text on the page.",
        ].join("\n\n"),
    },
    description: "Pojawi się na stronie O mnie pod nagłówkiem „Skontaktuj się ze mną”.",
    rows: 4,
}
