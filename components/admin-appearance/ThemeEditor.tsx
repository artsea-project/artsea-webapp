"use client"

import { useEffect, useReducer, useState } from "react"
import { Pipette } from "lucide-react"

import { saveSiteTheme } from "@/app/admin/appearance/actions"
import { getFontVariableClasses } from "@/app/fonts"
import { SaveBar, useSectionSave } from "@/components/admin-appearance/SaveBar"
import { ThemePreview, ThemeScope } from "@/components/admin-appearance/ThemePreview"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    isThemeDirty,
    themeEditorReducer,
    type ThemeDraft,
} from "@/lib/appearance/theme-editor-state"
import type { ThemeErrors } from "@/lib/appearance/validation"
import { fontCatalog, selectableFontNames, type FontName } from "@/lib/theme/fonts"
import { THEME_PRESETS, type ThemePresetId } from "@/lib/theme/presets"
import type { SiteThemeColors, SiteThemeFonts } from "@/types/theme"

const FONT_FIELDS: { field: keyof SiteThemeFonts; label: string }[] = [
    { field: "primaryFont", label: "Czcionka podstawowa - nagłówki" },
    { field: "secondaryFont", label: "Czcionka pomocnicza - nawigacja i akcenty" },
    { field: "additionalFont", label: "Czcionka tekstu" },
]

const COLOR_FIELDS: { field: keyof SiteThemeColors; label: string }[] = [
    { field: "foregroundColor", label: "Kolor tekstu" },
    { field: "backgroundColor", label: "Kolor tła" },
    { field: "accentColor", label: "Kolor akcentu" },
]

const FONT_GROUPS = [
    { label: "Szeryfowe", category: "serif" },
    { label: "Bezszeryfowe", category: "sans-serif" },
] as const

const fontPreviewClasses = getFontVariableClasses(selectableFontNames)

function FontSelect({
    label,
    value,
    error,
    onChange,
}: {
    label: string
    value: string
    error?: string
    onChange: (value: string) => void
}) {
    return (
        <Field>
            <FieldLabel>{label}</FieldLabel>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full" aria-invalid={Boolean(error)}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className={`admin-theme font-secondary ${fontPreviewClasses}`}>
                    {FONT_GROUPS.map((group) => (
                        <SelectGroup key={group.category}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {selectableFontNames
                                .filter((name) => fontCatalog[name].category === group.category)
                                .map((name) => (
                                    <SelectItem key={name} value={name}>
                                        <FontLabel name={name} />
                                    </SelectItem>
                                ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
            <FieldError>{error}</FieldError>
        </Field>
    )
}

/** A font name written in that font; the catalog family falls back to a generic font. */
function FontLabel({ name }: { name: FontName }) {
    return <span style={{ fontFamily: fontCatalog[name].family }}>{name}</span>
}

/** "#abc" -> "#aabbcc", because the native color picker only understands six digits. */
function toSixDigitHex(value: string): string {
    const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(value)
    return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : value
}

function ColorField({
    field,
    label,
    value,
    error,
    onChange,
}: {
    field: string
    label: string
    value: string
    error?: string
    onChange: (value: string) => void
}) {
    const pickerValue = /^#[\da-f]{6}$/i.test(toSixDigitHex(value))
        ? toSixDigitHex(value)
        : "#000000"

    return (
        <Field>
            <FieldLabel htmlFor={`theme-${field}`}>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <Input
                    id={`theme-${field}`}
                    value={value}
                    onChange={(event) => onChange(event.target.value.trim())}
                    aria-invalid={Boolean(error)}
                    spellCheck={false}
                    className="font-mono"
                />
                <ColorSwatch label={label} value={pickerValue} onChange={onChange} />
            </div>
            <FieldError>{error}</FieldError>
        </Field>
    )
}

/**
 * The browser's color input, shown as a square filled with the chosen color. The pipette badge
 * says it opens a picker; it sits on its own background so it stays visible on any color.
 */
function ColorSwatch({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) {
    return (
        <span className="relative size-9 shrink-0">
            <input
                type="color"
                value={value}
                onChange={(event) => onChange(event.target.value.toUpperCase())}
                aria-label={`${label}: próbnik`}
                className="block size-full cursor-pointer appearance-none rounded-md border border-border bg-background p-0.5 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
            />
            <span className="pointer-events-none absolute -right-1.5 -bottom-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm">
                <Pipette className="size-3" aria-hidden />
            </span>
        </span>
    )
}

function PresetPicker({ onPick }: { onPick: (preset: ThemePresetId) => void }) {
    return (
        <div className="@container flex flex-col gap-3">
            <p className="text-sm font-medium">Motywy domyślne</p>
            {/* Three columns only once the cards have room, otherwise the names break mid-word. */}
            <div className="grid grid-cols-1 gap-3 @md:grid-cols-3">
                {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onPick(id)}
                        className="rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <ThemeScope
                            theme={THEME_PRESETS[id]}
                            className="flex h-full flex-col gap-1 rounded-lg border p-3"
                        >
                            <span className="h-2 w-8 rounded-full bg-primary" />
                            <span className="font-primary text-lg leading-tight">
                                {THEME_PRESETS[id].label}
                            </span>
                            <span className="font-body text-xs text-muted-foreground">
                                {THEME_PRESETS[id].fonts.primaryFont} /{" "}
                                {THEME_PRESETS[id].fonts.additionalFont}
                            </span>
                        </ThemeScope>
                    </button>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
                Motyw wypełnia formularz; zapisz zmiany, żeby pojawiły się na stronie.
            </p>
        </div>
    )
}

export function ThemeEditor({
    saved,
    onDirtyChange,
}: {
    saved: ThemeDraft
    onDirtyChange: (dirty: boolean) => void
}) {
    const [state, dispatch] = useReducer(themeEditorReducer, { saved, draft: saved })
    const [errors, setErrors] = useState<ThemeErrors>({})
    const { isSaving, savedMessage, error, save, reset } = useSectionSave()
    const isDirty = isThemeDirty(state)

    useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

    function handleSave() {
        save(
            async () => {
                const result = await saveSiteTheme(state.draft)
                if (result.status === "success") return null
                setErrors(result.errors)
                return "Popraw zaznaczone pola."
            },
            () => {
                setErrors({})
                dispatch({ type: "saved" })
            }
        )
    }

    function clearError(field: keyof ThemeErrors) {
        if (errors[field]) setErrors({ ...errors, [field]: undefined })
    }

    function handleRevert() {
        dispatch({ type: "revert" })
        setErrors({})
        reset()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    {FONT_FIELDS.map(({ field, label }) => (
                        <FontSelect
                            key={field}
                            label={label}
                            value={state.draft.fonts[field]}
                            error={errors[field]}
                            onChange={(value) => {
                                dispatch({ type: "setFont", field, value })
                                clearError(field)
                            }}
                        />
                    ))}
                    <ThemePreview draft={state.draft} />
                </div>
                <div className="flex flex-col gap-4">
                    {COLOR_FIELDS.map(({ field, label }) => (
                        <ColorField
                            key={field}
                            field={field}
                            label={label}
                            value={state.draft.colors[field]}
                            error={errors[field]}
                            onChange={(value) => {
                                dispatch({ type: "setColor", field, value })
                                clearError(field)
                            }}
                        />
                    ))}
                    <PresetPicker
                        onPick={(preset) => {
                            dispatch({ type: "applyPreset", preset })
                            setErrors({})
                        }}
                    />
                </div>
            </div>
            <SaveBar
                isDirty={isDirty}
                isSaving={isSaving}
                onSave={handleSave}
                onRevert={handleRevert}
                savedMessage={savedMessage}
                error={error}
            />
        </div>
    )
}
