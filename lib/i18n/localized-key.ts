import type { Locale } from "@/i18n/routing"

const COLUMN_SUFFIX = { pl: "Pln", en: "Eng" } as const satisfies Record<Locale, string>

// Bilingual database columns come in pairs named `<field>Pln` and `<field>Eng`.
export function localizedKey<Field extends string>(field: Field, locale: Locale) {
    return `${field}${COLUMN_SUFFIX[locale]}` as `${Field}${(typeof COLUMN_SUFFIX)[Locale]}`
}
