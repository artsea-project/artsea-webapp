"use client"

import { useState } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export type BioLanguage = "pln" | "eng"

const LANGUAGES: { value: BioLanguage; label: string; inputName: string; placeholder: string }[] = [
    {
        value: "pln",
        label: "Polski",
        inputName: "bioPln",
        placeholder: [
            "Pierwszy akapit to krótkie wprowadzenie. Pojawi się na górze strony O mnie, obok zdjęcia.",
            "Drugi akapit rozwija temat. Na stronie będzie wyróżniony większą czcionką.",
            "Kolejne akapity to dalsza część biogramu, np. o Twojej drodze, technikach i współpracach.",
            "Akapity oddzielaj pustą linią, jak w tym przykładzie.",
        ].join("\n\n"),
    },
    {
        value: "eng",
        label: "English",
        inputName: "bioEng",
        placeholder: [
            "The first paragraph is a short introduction. It appears at the top of the About page, next to the photo.",
            "The second paragraph expands on it. It is shown in a larger font.",
            "Further paragraphs continue the bio, e.g. your path, techniques and collaborations.",
            "Separate paragraphs with a blank line, as in this example.",
        ].join("\n\n"),
    },
]

interface BioFieldProps {
    texts: Record<BioLanguage, string>
    onChange: (language: BioLanguage, text: string) => void
}

export default function BioField({ texts, onChange }: BioFieldProps) {
    const [language, setLanguage] = useState<BioLanguage>("pln")

    return (
        <Field>
            <FieldLabel htmlFor="bio">O mnie / About me</FieldLabel>
            <Tabs value={language} onValueChange={(value) => setLanguage(value as BioLanguage)}>
                <TabsList>
                    {LANGUAGES.map(({ value, label }) => (
                        <TabsTrigger key={value} value={value}>
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <Textarea
                id="bio"
                rows={6}
                value={texts[language]}
                placeholder={LANGUAGES.find(({ value }) => value === language)?.placeholder}
                onChange={(event) => onChange(language, event.target.value)}
            />
            {LANGUAGES.map(({ value, inputName }) => (
                <input key={value} type="hidden" name={inputName} value={texts[value]} />
            ))}
            <FieldDescription>
                Pierwszy akapit pojawi się jako wprowadzenie na stronie O mnie. Akapity oddziel
                pustą linią.
            </FieldDescription>
        </Field>
    )
}
