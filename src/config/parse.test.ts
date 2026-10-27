import { describe, expect, test } from "vitest"
import defaultToml from "./default.toml?raw"
import { parseConfig } from "./parse"

describe("parseConfig", () => {
  test("accepts the default config", () => {
    const result = parseConfig(defaultToml)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.layout.widgets).toEqual(["clock", "search", "links"])
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
        search: {},
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
      config: { version: 1, layout: { widgets: [] }, search: {}, groups: [] },
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

describe("parseConfig, the search", () => {
  const base = 'version = 1\n[layout]\nwidgets = ["search"]\n'
  const search = (toml: string) => {
    const result = parseConfig(base + toml)
    return result.ok ? { ok: true, search: result.config.search } : result
  }

  test("takes no search section as the browser's default engine", () => {
    expect(search("")).toEqual({ ok: true, search: {} })
  })

  test("reads the name of an engine", () => {
    expect(search('[search]\nengine = "DuckDuckGo"\n')).toEqual({
      ok: true,
      search: { engine: "DuckDuckGo" },
    })
  })

  test("reads a URL with %s for the query", () => {
    expect(search('[search]\nurl = "https://duckduckgo.com/?q=%s"\n')).toEqual({
      ok: true,
      search: { url: "https://duckduckgo.com/?q=%s" },
    })
  })

  test("refuses an engine and a URL together", () => {
    const toml = '[search]\nengine = "DuckDuckGo"\nurl = "https://duckduckgo.com/?q=%s"\n'
    expect(search(toml)).toEqual({
      ok: false,
      error: "search: give engine or url, not both",
    })
  })

  test("refuses a URL without %s", () => {
    expect(search('[search]\nurl = "https://duckduckgo.com/"\n')).toEqual({
      ok: false,
      error: "search.url: must have %s where the query goes",
    })
  })

  test("refuses a URL that is not http or https", () => {
    expect(search('[search]\nurl = "javascript:alert(%s)"\n')).toEqual({
      ok: false,
      error: "search.url: must be an http or https URL",
    })
  })

  test("refuses an empty engine", () => {
    expect(search('[search]\nengine = ""\n')).toEqual({
      ok: false,
      error: "search.engine: must not be empty",
    })
  })

  test("refuses an unknown key", () => {
    expect(search('[search]\nengnie = "DuckDuckGo"\n')).toEqual({
      ok: false,
      error: "search.engnie: unknown key",
    })
  })
})
