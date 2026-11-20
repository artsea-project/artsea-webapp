// Better Auth requires an email identifier. The reserved .invalid domain cannot receive mail.
export const artistLoginEmail = "artist@artsea.invalid"

const DEVELOPMENT_PUBLIC_URL = "http://localhost:3000"

export function getPublicUrl(
    value = process.env.ARTSEA_PUBLIC_URL,
    nodeEnvironment = process.env.NODE_ENV
): URL {
    if (!value && nodeEnvironment === "production") {
        throw new Error("ARTSEA_PUBLIC_URL must be set in production.")
    }

    const url = new URL(value ?? DEVELOPMENT_PUBLIC_URL)

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("ARTSEA_PUBLIC_URL must use HTTP or HTTPS.")
    }

    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
        throw new Error("ARTSEA_PUBLIC_URL must contain only the public origin.")
    }

    if (nodeEnvironment === "production" && url.protocol !== "https:") {
        throw new Error("ARTSEA_PUBLIC_URL must use HTTPS in production.")
    }

    return url
}
