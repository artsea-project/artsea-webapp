"use client"

import { useCallback, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

const UNREACHABLE_SERVER =
    "Nie udało się zapisać zmian: brak połączenia z serwerem. Sprawdź połączenie i spróbuj ponownie."

type SaveAction = () => Promise<string | null>

async function runSaveAction(action: SaveAction): Promise<string | null> {
    try {
        return await action()
    } catch {
        return UNREACHABLE_SERVER
    }
}

export function useSectionSave() {
    const [isSaving, startTransition] = useTransition()
    const [isSaved, setIsSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function save(action: SaveAction, onSuccess: () => void) {
        startTransition(async () => {
            const message = await runSaveAction(action)
            setError(message)
            setIsSaved(message === null)
            if (message === null) onSuccess()
        })
    }

    const reset = useCallback(() => {
        setError(null)
        setIsSaved(false)
    }, [])

    return { isSaving, isSaved, error, save, reset }
}

type SaveBarProps = {
    isDirty: boolean
    isSaving: boolean
    isSaved: boolean
    error: string | null
    onSave: () => void
    onRevert: () => void
}

export function SaveBar({ isDirty, isSaving, isSaved, error, onSave, onRevert }: SaveBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button
                type="button"
                disabled={isSaving || !isDirty}
                onClick={onSave}
                className="bg-foreground text-background hover:bg-foreground/90"
            >
                Zapisz zmiany
            </Button>
            <Button
                type="button"
                variant="outline"
                disabled={isSaving || !isDirty}
                onClick={onRevert}
            >
                Cofnij zmiany
            </Button>
            <p role="status" className="text-sm text-muted-foreground">
                {isSaved && !isDirty ? "Zapisano zmiany." : ""}
            </p>
            {error && (
                <p role="alert" className="basis-full text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    )
}
