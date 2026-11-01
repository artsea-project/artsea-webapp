import type { BilingualFieldCopy } from "@/components/admin-profile/BilingualTextField"

export const titleFieldCopy: BilingualFieldCopy = {
    id: "workTitle",
    label: "Tytuł",
    inputNames: { pln: "titlePln", eng: "titleEng" },
    placeholders: {
        pln: "Wpisz tytuł …",
        eng: "Wpisz tytuł …",
    },
    description: "",
}

export const techniqueFieldCopy: BilingualFieldCopy = {
    id: "workTechnique",
    label: "Technika",
    inputNames: { pln: "techniquePln", eng: "techniqueEng" },
    placeholders: {
        pln: "Opisz technikę wykonania pracy …",
        eng: "Opisz technikę wykonania pracy …",
    },
    description: "",
}

export const descriptionFieldCopy: BilingualFieldCopy = {
    id: "workDescription",
    label: "O projekcie",
    inputNames: { pln: "descriptionPln", eng: "descriptionEng" },
    placeholders: {
        pln: "Wpisz długi opis pracy …",
        eng: "Wpisz długi opis pracy …",
    },
    description: "",
    rows: 5,
}
