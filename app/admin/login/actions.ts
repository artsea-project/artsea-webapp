"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { after } from "next/server"
import { applyAuthCookies } from "@/lib/auth/next-cookies"
import { consumeLoginAttempt, pruneLoginRateLimitBuckets } from "@/lib/auth/login-rate-limit"
import { isNonemptyPassword } from "@/lib/auth/password"
import { signInArtist } from "@/lib/auth/server"

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
            return { error: "Nieprawidłowe hasło. Spróbuj ponownie." }
        }
        await applyAuthCookies(response)
    } catch {
        return { error: "Nieprawidłowe hasło. Spróbuj ponownie." }
    }

    redirect("/admin")
}
