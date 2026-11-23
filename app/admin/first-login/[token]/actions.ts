"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { applyAuthCookies } from "@/lib/auth/next-cookies"
import { registerArtist, type RegistrationResult } from "@/lib/auth/register"
import { signInArtist } from "@/lib/auth/server"

export type FirstLoginFormState = {
    error?: string
    fullName?: string
}

const errorMessages: Record<Exclude<RegistrationResult, { ok: true }>["code"], string> = {
    ACCOUNT_EXISTS: "Konto jest już skonfigurowane. Przejdź do logowania.",
    SETUP_COMPLETED:
        "Pierwsza konfiguracja została już zakończona. Przywróć konto z kopii zapasowej.",
    INVALID_TOKEN: "Ten prywatny link jest nieprawidłowy lub wygasł.",
    INVALID_NAME: "Wpisz imię i nazwisko lub pseudonim.",
    PASSWORD_MISMATCH: "Hasła nie są takie same.",
    INVALID_PASSWORD: "Wpisz hasło.",
}

export async function registerAction(
    _previousState: FirstLoginFormState,
    formData: FormData
): Promise<FirstLoginFormState> {
    const fullName = formData.get("full-name")
    const password = formData.get("password")
    const repeatedPassword = formData.get("repeat-password")
    const setupToken = formData.get("setup-token")

    if (
        typeof fullName !== "string" ||
        typeof password !== "string" ||
        typeof repeatedPassword !== "string" ||
        typeof setupToken !== "string"
    ) {
        return { error: "Nie udało się odczytać formularza. Spróbuj ponownie." }
    }

    const result = await registerArtist({
        fullName,
        password,
        repeatedPassword,
        setupToken,
    })
    if (!result.ok) {
        return { error: errorMessages[result.code], fullName }
    }

    try {
        const response = await signInArtist(password, await headers())
        if (!response.ok) {
            redirect("/admin/login?created=1")
        }
        await applyAuthCookies(response)
    } catch {
        redirect("/admin/login?created=1")
    }

    redirect("/admin")
}
