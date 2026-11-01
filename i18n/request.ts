import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"
import { notFound } from "next/navigation"
import { locale as rootLocale } from "next/root-params"

import { routing } from "@/i18n/routing"

export default getRequestConfig(async ({ locale }) => {
    const requested = locale ?? (await rootLocale())
    if (!hasLocale(routing.locales, requested)) notFound()

    return {
        locale: requested,
        messages: (await import(`../messages/${requested}.json`)).default,
    }
})
