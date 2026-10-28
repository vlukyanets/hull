import { describe, expect, test } from "vitest"
import { msToNextMinute, timeParts } from "./time"

test("waits until the next minute starts", () => {
  expect(msToNextMinute(new Date(2026, 9, 26, 12, 30, 0, 0))).toBe(60_000)
  expect(msToNextMinute(new Date(2026, 9, 26, 12, 30, 45, 500))).toBe(14_500)
  expect(msToNextMinute(new Date(2026, 9, 26, 12, 30, 59, 999))).toBe(1)
})

describe("timeParts", () => {
  const at = new Date(2026, 9, 28, 11, 2)
  const short = (locale: string) => new Intl.DateTimeFormat(locale, { timeStyle: "short" })

  test("gives the hour and the period of the day apart", () => {
    expect(timeParts(at, short("en-US"))).toEqual([
      { text: "11:02", period: false },
      { text: "AM", period: true },
    ])
  })

  test("keeps the order of a locale that puts the period first", () => {
    expect(timeParts(at, short("ko-KR"))).toEqual([
      { text: "오전", period: true },
      { text: "11:02", period: false },
    ])
  })

  test("gives the time alone in a 24-hour locale", () => {
    expect(timeParts(new Date(2026, 9, 28, 23, 2), short("de-DE"))).toEqual([
      { text: "23:02", period: false },
    ])
  })
})
