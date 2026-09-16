import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth/server"

export async function readArtistSession(requestHeaders: Headers) {
    const auth = await getAuth()
    return auth.api.getSession({
        headers: requestHeaders,
        query: { disableCookieCache: true },
    })
}

export const getArtistSession = cache(async () => readArtistSession(await headers()))

export async function requireArtistSession() {
    const session = await getArtistSession()
    if (!session) {
        redirect("/admin/login")
    }
    return session
}
