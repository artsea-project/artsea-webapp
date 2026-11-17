import { expect, test } from "@playwright/test"

import { isHexColor, isSameColor } from "@/lib/theme/colors"
import { isSelectableFontName } from "@/lib/theme/fonts"
import { THEME_PRESETS, findMatchingPreset } from "@/lib/theme/presets"
import { defaultSiteTheme } from "@/lib/theme/theme"

test("every preset uses selectable fonts and valid hex colors", () => {
    for (const preset of Object.values(THEME_PRESETS)) {
        expect(Object.values(preset.fonts).every(isSelectableFontName)).toBe(true)
        expect(Object.values(preset.colors).every(isHexColor)).toBe(true)
    }
})

test("the default preset matches the default site theme", () => {
    expect(THEME_PRESETS.default.fonts).toEqual(defaultSiteTheme.fonts)
    expect(THEME_PRESETS.default.colors).toEqual(defaultSiteTheme.colors)
})

test("isHexColor accepts #rgb and #rrggbb only", () => {
    expect(isHexColor("#abc")).toBe(true)
    expect(isHexColor("#A8A29E")).toBe(true)
    expect(isHexColor("#12")).toBe(false)
    expect(isHexColor("A8A29E")).toBe(false)
    expect(isHexColor("#A8A29E80")).toBe(false)
    expect(isHexColor(undefined)).toBe(false)
})

test("isSameColor ignores letter case and the short form", () => {
    expect(isSameColor("#1c1917", "#1C1917")).toBe(true)
    expect(isSameColor("#abc", "#AABBCC")).toBe(true)
    expect(isSameColor("#1C1917", "#1C1918")).toBe(false)
})

test("findMatchingPreset names the preset whose fonts and colors were saved", () => {
    const dark = THEME_PRESETS.dark
    const lowercaseDark = {
        fonts: dark.fonts,
        colors: { ...dark.colors, backgroundColor: dark.colors.backgroundColor.toLowerCase() },
    }
    const customized = { ...dark, fonts: { ...dark.fonts, primaryFont: "Lora" } }

    expect(findMatchingPreset(dark)).toBe("dark")
    expect(findMatchingPreset(lowercaseDark)).toBe("dark")
    expect(findMatchingPreset(customized)).toBe(null)
})
