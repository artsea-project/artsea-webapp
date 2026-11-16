"use client"

import { useReducer } from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { themeEditorReducer, type ThemeDraft } from "@/lib/appearance/theme-editor-state"
import { fontCatalog, selectableFontNames } from "@/lib/theme/fonts"
import type { SiteThemeFonts } from "@/types/theme"

const FONT_FIELDS: { field: keyof SiteThemeFonts; label: string }[] = [
    { field: "primaryFont", label: "Czcionka podstawowa - nagłówki" },
    { field: "secondaryFont", label: "Czcionka pomocnicza - nawigacja i akcenty" },
    { field: "additionalFont", label: "Czcionka tekstu" },
]

const FONT_GROUPS = [
    { label: "Szeryfowe", category: "serif" },
    { label: "Bezszeryfowe", category: "sans-serif" },
] as const

function FontSelect({
    field,
    label,
    value,
    onChange,
}: {
    field: keyof SiteThemeFonts
    label: string
    value: string
    onChange: (value: string) => void
}) {
    const id = `theme-${field}`

    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="admin-theme font-secondary">
                    {FONT_GROUPS.map((group) => (
                        <SelectGroup key={group.category}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {selectableFontNames
                                .filter((name) => fontCatalog[name].category === group.category)
                                .map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    )
}

export function ThemeEditor({ saved }: { saved: ThemeDraft }) {
    const [state, dispatch] = useReducer(themeEditorReducer, { saved, draft: saved })

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
                {FONT_FIELDS.map(({ field, label }) => (
                    <FontSelect
                        key={field}
                        field={field}
                        label={label}
                        value={state.draft.fonts[field]}
                        onChange={(value) => dispatch({ type: "setFont", field, value })}
                    />
                ))}
            </div>
        </div>
    )
}
