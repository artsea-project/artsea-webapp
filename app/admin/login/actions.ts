"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { after } from "next/server"
import { applyAuthCookies } from "@/lib/auth/next-cookies"
import { consumeLoginAttempt, pruneLoginRateLimitBuckets } from "@/lib/auth/login-rate-limit"
import { isNonemptyPassword } from "@/lib/auth/password"
import { signInArtist } from "@/lib/auth/server"

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
        const requestHeaders = await headers()
        const allowed = await consumeLoginAttempt(requestHeaders)
        after(() => pruneLoginRateLimitBuckets())
        if (!allowed) {
            return { error: "Zbyt wiele prób logowania. Spróbuj ponownie za minutę." }
        }

        const response = await signInArtist(password, requestHeaders)
        if (!response.ok) {
            const body: { code?: string } | null = await response.json()
            if (body?.code === "INVALID_EMAIL_OR_PASSWORD") {
                return { error: "Nieprawidłowe hasło. Spróbuj ponownie." }
            }
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
