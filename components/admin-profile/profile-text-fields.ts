import type { BilingualFieldCopy } from "@/components/admin-profile/BilingualTextField"

export const bioFieldCopy: BilingualFieldCopy = {
    id: "bio",
    label: "O mnie / About me",
    inputNames: { pln: "bioPln", eng: "bioEng" },
    placeholders: {
        pln: [
            "Pierwszy akapit to krótkie wprowadzenie. Pojawi się na górze strony O mnie, obok zdjęcia.",
            "Drugi akapit rozwija temat. Na stronie będzie wyróżniony większą czcionką.",
            "Kolejne akapity to dalsza część biogramu, np. o Twojej drodze, technikach i współpracach.",
            "Akapity oddzielaj pustą linią, jak w tym przykładzie.",
        ].join("\n\n"),
        eng: [
            "The first paragraph is a short introduction. It appears at the top of the About page, next to the photo.",
            "The second paragraph expands on it. It is shown in a larger font.",
            "Further paragraphs continue the bio, e.g. your path, techniques and collaborations.",
            "Separate paragraphs with a blank line, as in this example.",
        ].join("\n\n"),
    },
    description:
        "Pierwszy akapit pojawi się jako wprowadzenie na stronie O mnie. Akapity oddziel pustą linią.",
    rows: 6,
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
