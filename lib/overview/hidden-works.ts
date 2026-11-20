const pluralRules = new Intl.PluralRules("pl")

const HIDDEN_WORK_FORMS: Partial<Record<Intl.LDMLPluralRule, string>> = {
    one: "ukryta",
    few: "ukryte",
}

export function describeHiddenWorks(count: number): string | null {
    if (count === 0) return null

    return `${count} ${HIDDEN_WORK_FORMS[pluralRules.select(count)] ?? "ukrytych"}`
}
