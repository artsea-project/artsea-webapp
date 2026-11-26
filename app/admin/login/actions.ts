"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { applyAuthCookies } from "@/lib/auth/next-cookies"
import { isNonemptyPassword } from "@/lib/auth/password"
import { signInArtistWithRateLimit } from "@/lib/auth/server"

const loginUnavailable = "Nie udało się zalogować. Spróbuj ponownie za chwilę."

export type LoginFormState = {
    error?: string
}

export async function loginAction(
    _previousState: LoginFormState,
    formData: FormData
): Promise<LoginFormState> {
    const password = formData.get("password")
    if (!isNonemptyPassword(password)) {
        return { error: "Wpisz hasło." }
    }

    try {
        const result = await signInArtistWithRateLimit(password, await headers())
        if (result.status === "limited") {
            return { error: "Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut." }
        }

        if (result.status === "invalid-password") {
            return { error: "Nieprawidłowe hasło. Spróbuj ponownie." }
        }

        const { response } = result
        if (!response.ok) {
            console.error("Admin sign-in failed with status", response.status)
            return { error: loginUnavailable }
        }
        await applyAuthCookies(response)
    } catch {
        console.error("Admin sign-in could not be completed.")
        return { error: loginUnavailable }
    }

    redirect("/admin")
}
