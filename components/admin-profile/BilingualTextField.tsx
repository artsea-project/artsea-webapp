"use client"

import { useState } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export type Language = "pln" | "eng"

export type BilingualTexts = Record<Language, string>

export interface BilingualFieldCopy {
    id: string
    label: string
    inputNames: Record<Language, string>
    placeholders: BilingualTexts
    description: string
    rows: number
}

const LANGUAGES: { value: Language; label: string }[] = [
    { value: "pln", label: "Polski" },
    { value: "eng", label: "English" },
]

interface BilingualTextFieldProps {
    copy: BilingualFieldCopy
    texts: BilingualTexts
    onChange: (language: Language, text: string) => void
}

export default function BilingualTextField({ copy, texts, onChange }: BilingualTextFieldProps) {
    const [language, setLanguage] = useState<Language>("pln")

    return (
        <Field>
            <FieldLabel htmlFor={copy.id}>{copy.label}</FieldLabel>
            <Tabs value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <TabsList>
                    {LANGUAGES.map(({ value, label }) => (
                        <TabsTrigger key={value} value={value}>
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <Textarea
                id={copy.id}
                rows={copy.rows}
                value={texts[language]}
                placeholder={copy.placeholders[language]}
                onChange={(event) => onChange(language, event.target.value)}
            />
            {LANGUAGES.map(({ value }) => (
                <input
                    key={value}
                    type="hidden"
                    name={copy.inputNames[value]}
                    value={texts[value]}
                />
            ))}
            <FieldDescription>{copy.description}</FieldDescription>
        </Field>
    )
}
