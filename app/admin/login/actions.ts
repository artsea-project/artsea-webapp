"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { applyAuthCookies } from "@/lib/auth/next-cookies"
import { consumeLoginAttempt } from "@/lib/auth/login-rate-limit"
import { artistLoginEmail } from "@/lib/auth/config"
import { isNonemptyPassword } from "@/lib/auth/password"
import { getAuth } from "@/lib/auth/server"

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
        if (!(await consumeLoginAttempt(requestHeaders))) {
            return { error: "Zbyt wiele prób logowania. Spróbuj ponownie za minutę." }
        }

        const auth = await getAuth()
        const response = await auth.api.signInEmail({
            body: { email: artistLoginEmail, password },
            headers: requestHeaders,
            asResponse: true,
        })
        if (!response.ok) {
            return { error: "Nieprawidłowe hasło. Spróbuj ponownie." }
        }
        await applyAuthCookies(response)
    } catch {
        return { error: "Nieprawidłowe hasło. Spróbuj ponownie." }
    }

    redirect("/admin")
}
