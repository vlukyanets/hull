import { describe, expect, test } from "vitest"
import defaultToml from "./default.toml?raw"
import { parseConfig } from "./parse"

describe("parseConfig", () => {
  test("accepts the default config", () => {
    const result = parseConfig(defaultToml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.layout.widgets).toEqual(["clock", "links"])
      expect(result.config.groups.length).toBeGreaterThan(0)
    }
  })

  test("reads the groups of links", () => {
    const toml = `version = 1
[layout]
widgets = ["links"]
[[groups]]
name = "Home"
links = [{ name = "Router", url = "http://192.168.1.1" }]
`
    expect(parseConfig(toml)).toEqual({
      ok: true,
      config: {
        version: 1,
        layout: { widgets: ["links"] },
        groups: [
          { name: "Home", links: [{ name: "Router", url: "http://192.168.1.1" }] },
        ],
      },
    })
  })

  test("takes no groups as an empty list", () => {
    const result = parseConfig("version = 1\n[layout]\nwidgets = []\n")
    expect(result).toEqual({
      ok: true,
      config: { version: 1, layout: { widgets: [] }, groups: [] },
    })
  })

  test("refuses a link that is not http or https", () => {
    const toml = `version = 1
[layout]
widgets = []
[[groups]]
name = "Home"
links = [
  { name = "Fine", url = "https://example.com" },
  { name = "Script", url = "javascript:alert(1)" },
]
`
    expect(parseConfig(toml)).toEqual({
      ok: false,
      error: "groups[0].links[1].url: must be an http or https URL",
    })
  })

  test("refuses a link that is not a URL", () => {
    const toml = `version = 1
[layout]
widgets = []
[[groups]]
name = "Home"
links = [{ name = "Router", url = "192.168.1.1" }]
`
    expect(parseConfig(toml)).toEqual({
      ok: false,
      error: "groups[0].links[0].url: must be an http or https URL",
    })
  })

  test("refuses a link without a name", () => {
    const toml = `version = 1
[layout]
widgets = []
[[groups]]
name = "Home"
links = [{ name = " ", url = "https://example.com" }]
`
    expect(parseConfig(toml)).toEqual({
      ok: false,
      error: "groups[0].links[0].name: must not be empty",
    })
  })

  test("refuses an unknown key in a link", () => {
    const toml = `version = 1
[layout]
widgets = []
[[groups]]
name = "Home"
links = [{ name = "A", url = "https://example.com", icon = "a.png" }]
`
    expect(parseConfig(toml)).toEqual({
      ok: false,
      error: "groups[0].links[0].icon: unknown key",
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
