import { expect, test } from "vitest"
import { msToNextMinute } from "./time"

test("waits until the next minute starts", () => {
  expect(msToNextMinute(new Date(2026, 9, 26, 12, 30, 0, 0))).toBe(60_000)
  expect(msToNextMinute(new Date(2026, 9, 26, 12, 30, 45, 500))).toBe(14_500)
  expect(msToNextMinute(new Date(2026, 9, 26, 12, 30, 59, 999))).toBe(1)
})
