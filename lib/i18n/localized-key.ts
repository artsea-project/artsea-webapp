import type { Locale } from "@/i18n/routing"

const COLUMN_SUFFIX = { pl: "Pln", en: "Eng" } as const satisfies Record<Locale, string>

type Suffix = (typeof COLUMN_SUFFIX)[Locale]

// Bilingual database columns come in pairs named `<field>Pln` and `<field>Eng`.
export function localizedKey<Field extends string>(field: Field, locale: Locale) {
    return `${field}${COLUMN_SUFFIX[locale]}` as `${Field}${Suffix}`
}

// Bilingual values kept in code use the same pair as plain keys: `{ pln, eng }`.
export function localizedValue<Value>(values: Record<Lowercase<Suffix>, Value>, locale: Locale) {
    return values[COLUMN_SUFFIX[locale].toLowerCase() as Lowercase<Suffix>]
}
