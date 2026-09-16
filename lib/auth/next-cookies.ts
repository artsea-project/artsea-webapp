import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies"
import { cookies } from "next/headers"

export async function applyAuthCookies(response: Response) {
    const setCookie = response.headers.get("set-cookie")
    if (!setCookie) {
        return
    }

    const cookieStore = await cookies()
    for (const [name, attributes] of parseSetCookieHeader(setCookie)) {
        cookieStore.set(name, attributes.value, toCookieOptions(attributes))
    }
}
