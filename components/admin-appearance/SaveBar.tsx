"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

const UNREACHABLE_SERVER =
    "Nie udało się zapisać zmian: brak połączenia z serwerem. Sprawdź połączenie i spróbuj ponownie."

/** The action's own result, or a message when the request itself failed (server unreachable). */
async function runSaveAction(action: () => Promise<string | null>): Promise<string | null> {
    try {
        return await action()
    } catch {
        return UNREACHABLE_SERVER
    }
}

/**
 * Runs a section's save action and tracks its pending state, the "saved" note and the error.
 * The action resolves to null on success or to an error message.
 */
export function useSectionSave() {
    const [isSaving, startTransition] = useTransition()
    const [savedMessage, setSavedMessage] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function save(action: () => Promise<string | null>, onSuccess: () => void) {
        startTransition(async () => {
            const message = await runSaveAction(action)
            setError(message)
            setSavedMessage(message === null)
            if (message === null) onSuccess()
        })
    }

    function reset() {
        setError(null)
        setSavedMessage(false)
    }

    return { isSaving, savedMessage, error, save, reset }
}

type SaveBarProps = {
    isDirty: boolean
    isSaving: boolean
    onSave: () => void
    onRevert: () => void
    savedMessage: boolean
    error?: string | null
}

/** "Zapisz zmiany" and "Cofnij zmiany" for one section, matching the profile form. */
export function SaveBar({
    isDirty,
    isSaving,
    onSave,
    onRevert,
    savedMessage,
    error,
}: SaveBarProps) {
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
                {savedMessage && !isDirty ? "Zapisano zmiany." : ""}
            </p>
            {error && (
                <p role="alert" className="basis-full text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    )
}
