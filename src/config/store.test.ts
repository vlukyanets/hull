import { describe, expect, test } from "vitest"
import { configToml, loadConfig, saveConfig, storeConfig, watchConfig, type Config } from "."
import { memoryStore } from "./memoryStore"
import { parseConfig } from "./parse"

const mine = `version = 1
[layout]
widgets = ["links"]
[[groups]]
name = "Home"
links = [{ name = "NAS", url = "https://nas.lan" }]
`

describe("loadConfig", () => {
  test("gives the default config on a first run", async () => {
    const loaded = await loadConfig(memoryStore())
    expect(loaded.error).toBeUndefined()
    expect(loaded.config.layout.widgets).toEqual(["clock", "search", "links"])
  })

  test("gives the stored config", async () => {
    const store = memoryStore()
    await saveConfig(store, mine)
    const loaded = await loadConfig(store)
    expect(loaded).toEqual({ config: (parseConfig(mine) as { config: unknown }).config })
  })

  test("falls back to the default with an error when the stored config is bad", async () => {
    const loaded = await loadConfig(memoryStore({ config: { version: 7 } }))
    expect(loaded.config.layout.widgets).toEqual(["clock", "search", "links"])
    expect(loaded.error).toBe("The saved config is not valid (version: must be 1), so hull shows the default one.")
  })
})

describe("saveConfig", () => {
  test("stores nothing when the TOML is bad", async () => {
    const data: Record<string, unknown> = {}
    const result = await saveConfig(memoryStore(data), "version = \n")
    expect(result).toEqual({ ok: false, error: "line 1, column 11: invalid value" })
    expect(data).toEqual({})
  })
})

describe("storeConfig", () => {
  test("stores a valid config", async () => {
    const data: Record<string, unknown> = {}
    const config = (parseConfig(mine) as { config: Config }).config
    expect(await storeConfig(memoryStore(data), config)).toEqual({ ok: true, config })
    expect(data.config).toEqual(config)
  })

  test("stores nothing when the config is bad", async () => {
    const data: Record<string, unknown> = {}
    const config = (parseConfig(mine) as { config: Config }).config
    config.groups[0].links[0].name = " "
    expect(await storeConfig(memoryStore(data), config)).toEqual({
      ok: false,
      error: "groups[0].links[0].name: must not be empty",
    })
    expect(data).toEqual({})
  })
})

describe("configToml", () => {
  test("writes TOML that reads back as the same config", async () => {
    const config = (await loadConfig(memoryStore())).config
    expect(parseConfig(configToml(config))).toEqual({ ok: true, config })
  })
})

describe("watchConfig", () => {
  test("calls back with the config now and after every save", async () => {
    const store = memoryStore()
    const seen: string[][] = []
    const stop = watchConfig(store, (loaded) => seen.push(loaded.config.layout.widgets))
    await new Promise((r) => setTimeout(r))
    await saveConfig(store, mine)
    stop()
    await saveConfig(store, "version = 1\n[layout]\nwidgets = []\n")
    expect(seen).toEqual([["clock", "search", "links"], ["links"]])
  })
})
