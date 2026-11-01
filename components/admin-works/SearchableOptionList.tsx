"use client"

import { Search } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

export interface ChecklistOption {
    id: string
    label: string
    searchTerms: string
}

interface SearchableOptionListProps {
    label: string
    searchPlaceholder: string
    options: ChecklistOption[]
    selectedIds: string[]
    error?: string
    headerAction?: ReactNode
    onToggle: (id: string) => void
}

export default function SearchableOptionList({
    label,
    searchPlaceholder,
    options,
    selectedIds,
    error,
    headerAction,
    onToggle,
}: SearchableOptionListProps) {
    const [search, setSearch] = useState("")

    const filteredOptions = useMemo(() => {
        const needle = search.trim().toLowerCase()
        if (!needle) return options
        return options.filter((option) => option.searchTerms.toLowerCase().includes(needle))
    }, [options, search])

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

    return (
        <Field data-invalid={Boolean(error)}>
            <div className="flex items-center justify-between gap-2">
                <FieldLabel className="font-bold">{label}</FieldLabel>
                {headerAction}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 focus-within:border-ring">
                    <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                </div>

                <div className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1">
                    {filteredOptions.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                            Brak wyników.
                        </p>
                    ) : (
                        filteredOptions.map((option) => {
                            const checkboxId = `checklist-${option.id}`
                            const isChecked = selectedSet.has(option.id)
                            return (
                                <label
                                    key={option.id}
                                    htmlFor={checkboxId}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-xs text-foreground transition-colors hover:bg-muted/50"
                                >
                                    <Checkbox
                                        id={checkboxId}
                                        checked={isChecked}
                                        onCheckedChange={() => onToggle(option.id)}
                                    />
                                    <span className="truncate">{option.label}</span>
                                </label>
                            )
                        })
                    )}
                </div>
            </div>

            <FieldError>{error}</FieldError>
        </Field>
    )
}
