import { expect, test } from "@playwright/test"
import { Suspense } from "react"
import AboutPage from "@/app/(public)/about/page"

test("streams uncached about-page data behind Suspense", () => {
    const page = AboutPage()
    expect(page.type).toBe(Suspense)
    expect(page.props.fallback).toBeNull()
})
