import { describe, expect, test } from "vitest"
import defaultToml from "./default.toml?raw"
import { parseConfig } from "./parse"

describe("parseConfig", () => {
  test("accepts the default config", () => {
    expect(parseConfig(defaultToml)).toEqual({
      ok: true,
      config: { version: 1, layout: { widgets: ["clock"] } },
    })
  })

  test("refuses broken TOML with the line and the reason", () => {
    expect(parseConfig("version = 1\nlayout = \n")).toEqual({
      ok: false,
      error: "line 2, column 10: invalid value",
    })
  })

  test("refuses a version it does not know", () => {
    expect(parseConfig("version = 2\n[layout]\nwidgets = []\n")).toEqual({
      ok: false,
      error: "version: must be 1",
    })
  })

  test("refuses an unknown widget", () => {
    const toml = 'version = 1\n[layout]\nwidgets = ["clock", "clok"]\n'
    expect(parseConfig(toml)).toEqual({
      ok: false,
      error: 'layout.widgets[1]: unknown widget "clok"',
    })
  })

  test("refuses a widget listed twice", () => {
    const toml = 'version = 1\n[layout]\nwidgets = ["clock", "clock"]\n'
    expect(parseConfig(toml)).toEqual({
      ok: false,
      error: 'layout.widgets[1]: "clock" is listed twice',
    })
  })

  test("refuses an unknown key, so a typo does not pass unseen", () => {
    const toml = "version = 1\n[layuot]\nwidgets = []\n"
    expect(parseConfig(toml)).toEqual({
      ok: false,
      error: "layuot: unknown key",
    })
  })

  test("refuses a missing section", () => {
    expect(parseConfig("version = 1\n")).toEqual({
      ok: false,
      error: "layout: missing",
    })
  })
})
