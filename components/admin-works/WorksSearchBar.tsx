"use client"

import { ChevronDown, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { buildWorksHref } from "@/components/admin-works/WorksPagination"
import { Button } from "@/components/ui/button"
import type { WorkCategoryOption } from "@/lib/works/queries"

interface WorksSearchBarProps {
    initialSearch: string
    selectedCategoryId?: string
    categories?: WorkCategoryOption[]
}

export default function WorksSearchBar({
    initialSearch,
    selectedCategoryId = "",
    categories = [],
}: WorksSearchBarProps) {
    const router = useRouter()
    const [query, setQuery] = useState(initialSearch)

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = query.trim()
        router.push(buildWorksHref({ search: trimmed, categoryId: selectedCategoryId }))
    }

    function handleClear() {
        setQuery("")
        if (initialSearch) {
            router.push(buildWorksHref({ categoryId: selectedCategoryId }))
        }
    }

    function handleCategoryChange(nextCategoryId: string) {
        router.push(buildWorksHref({ search: query.trim(), categoryId: nextCategoryId }))
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form
                role="search"
                onSubmit={handleSubmit}
                className="flex h-12 w-full max-w-md items-center gap-2 rounded-full border border-border bg-background pr-1.5 pl-4 transition-colors focus-within:border-ring"
            >
                <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <input
                    type="search"
                    name="q"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Wpisz interesującą cię frazę …"
                    aria-label="Szukaj prac"
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
                />

                {query ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Wyczyść frazę wyszukiwania"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <X className="size-3.5" />
                    </button>
                ) : null}

                <Button
                    type="submit"
                    className="h-9 rounded-full bg-foreground px-5 text-xs font-medium text-background hover:bg-foreground/90"
                >
                    Szukaj
                </Button>
            </form>

            <div className="relative w-full sm:w-60">
                <select
                    value={selectedCategoryId}
                    onChange={(event) => handleCategoryChange(event.target.value)}
                    aria-label="Filtruj po kategorii"
                    className="h-12 w-full appearance-none rounded-full border border-border bg-background pr-10 pl-4 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:outline-none"
                >
                    <option value="">Wszystkie kategorie</option>
                    {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                            {category.namePln}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
                />
            </div>
        </div>
    )
}
