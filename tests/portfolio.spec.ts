import { expect, test } from "@playwright/test"

import { parsePortfolioQuery } from "../lib/portfolio"

test("parses page numbers defensively", () => {
    expect(parsePortfolioQuery({ page: "0" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "-1" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "abc" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "2.5" }).page).toBe(1)
    expect(parsePortfolioQuery({ page: ["2", "3"] }).page).toBe(1)
    expect(parsePortfolioQuery({ page: "99" }).page).toBe(99)
})

test("treats empty or repeated filters as missing", () => {
    expect(parsePortfolioQuery({})).toEqual({ category: null, tag: null, page: 1 })
    expect(parsePortfolioQuery({ category: "", tag: "  " }).category).toBeNull()
    expect(parsePortfolioQuery({ tag: ["a", "b"] }).tag).toBeNull()
    expect(parsePortfolioQuery({ category: "Rzeźba" }).category).toBe("Rzeźba")
})
