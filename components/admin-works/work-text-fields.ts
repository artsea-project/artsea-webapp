import type { BilingualFieldCopy } from "@/components/admin-profile/BilingualTextField"

export const titleFieldCopy: BilingualFieldCopy = {
    id: "workTitle",
    label: "Tytuł",
    inputNames: { pln: "titlePln", eng: "titleEng" },
    placeholders: {
        pln: "Wpisz tytuł po polsku…",
        eng: "Wpisz tytuł po angielsku…",
    },
    description: "",
}

export const techniqueFieldCopy: BilingualFieldCopy = {
    id: "workTechnique",
    label: "Technika",
    inputNames: { pln: "techniquePln", eng: "techniqueEng" },
    placeholders: {
        pln: "Opisz technikę wykonania pracy po polsku…",
        eng: "Opisz technikę wykonania pracy po angielsku…",
    },
    description: "",
}

export const descriptionFieldCopy: BilingualFieldCopy = {
    id: "workDescription",
    label: "O projekcie",
    inputNames: { pln: "descriptionPln", eng: "descriptionEng" },
    placeholders: {
        pln: "Wpisz opis pracy po polsku …",
        eng: "Wpisz opis pracy po angielsku…",
    },
    description: "",
    rows: 5,
}
