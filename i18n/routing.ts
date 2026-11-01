import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
    locales: ["pl", "en"],
    defaultLocale: "pl",
    localePrefix: "as-needed",
    localeCookie: {
        // A year, so the chosen language survives closing the browser.
        maxAge: 60 * 60 * 24 * 365,
    },
})

export type Locale = (typeof routing.locales)[number]
