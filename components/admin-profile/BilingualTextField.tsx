"use client"

import { useState } from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
    // Without rows the field is a single-line input.
    rows?: number
}

const LANGUAGES: { value: Language; label: string }[] = [
    { value: "pln", label: "Polski" },
    { value: "eng", label: "English" },
]

interface BilingualTextFieldProps {
    copy: BilingualFieldCopy
    texts: BilingualTexts
    error?: string
    onChange: (language: Language, text: string) => void
}

export default function BilingualTextField({
    copy,
    texts,
    error,
    onChange,
}: BilingualTextFieldProps) {
    const [language, setLanguage] = useState<Language>("pln")
    const control = {
        id: copy.id,
        value: texts[language],
        placeholder: copy.placeholders[language],
        "aria-invalid": Boolean(error),
    }

    return (
        <Field data-invalid={Boolean(error)}>
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
            {copy.rows ? (
                <Textarea
                    {...control}
                    rows={copy.rows}
                    onChange={(event) => onChange(language, event.target.value)}
                />
            ) : (
                <Input {...control} onChange={(event) => onChange(language, event.target.value)} />
            )}
            {LANGUAGES.map(({ value }) => (
                <input
                    key={value}
                    type="hidden"
                    name={copy.inputNames[value]}
                    value={texts[value]}
                />
            ))}
            <FieldDescription>{copy.description}</FieldDescription>
            <FieldError>{error}</FieldError>
        </Field>
    )
}
