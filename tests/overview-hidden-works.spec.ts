import { expect, test } from "@playwright/test"

import { describeHiddenWorks } from "../lib/overview/hidden-works"

test("describeHiddenWorks says nothing when no work is hidden", () => {
    expect(describeHiddenWorks(0)).toBeNull()
})

test("describeHiddenWorks uses the Polish plural form for the count", () => {
    expect(describeHiddenWorks(1)).toBe("1 ukryta")
    expect(describeHiddenWorks(2)).toBe("2 ukryte")
    expect(describeHiddenWorks(4)).toBe("4 ukryte")
    expect(describeHiddenWorks(5)).toBe("5 ukrytych")
    expect(describeHiddenWorks(12)).toBe("12 ukrytych")
    expect(describeHiddenWorks(21)).toBe("21 ukrytych")
    expect(describeHiddenWorks(22)).toBe("22 ukryte")
    expect(describeHiddenWorks(112)).toBe("112 ukrytych")
})
