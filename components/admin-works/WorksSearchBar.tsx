"use client"

import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import VisibilitySwitch from "@/components/admin-works/VisibilitySwitch"
import { buildWorksHref } from "@/components/admin-works/WorksPagination"
import { Button } from "@/components/ui/button"

interface WorksSearchBarProps {
    initialSearch: string
    onlyHidden?: boolean
}

export default function WorksSearchBar({ initialSearch, onlyHidden = false }: WorksSearchBarProps) {
    const router = useRouter()
    const [query, setQuery] = useState(initialSearch)

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = query.trim()
        router.push(buildWorksHref({ search: trimmed, onlyHidden }))
    }

    function handleClear() {
        setQuery("")
        if (initialSearch) {
            router.push(buildWorksHref({ onlyHidden }))
        }
    }

    function handleToggleHidden() {
        router.push(buildWorksHref({ search: query.trim(), onlyHidden: !onlyHidden }))
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
                    placeholder="Wpisz kategorię, tytuł, tag lub rok"
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

            <VisibilitySwitch
                checked={onlyHidden}
                label="Tylko niewidoczne"
                ariaLabel="Filtruj tylko niewidoczne prace"
                onToggle={handleToggleHidden}
            />
        </div>
    )
}
