import { describe, expect, test } from "vitest"
import { configToml, loadConfig, saveConfig, watchConfig } from "."
import { parseConfig } from "./parse"
import type { Store } from "./store"

// storage.local in memory, with change events like the real one.
function memoryStore(data: Record<string, unknown> = {}): Store {
  const listeners = new Set<(key: string, value: unknown) => void>()
  return {
    async get(key) {
      return structuredClone(data[key])
    },
    async set(key, value) {
      data[key] = structuredClone(value)
      for (const listener of listeners) listener(key, structuredClone(value))
    },
    onChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

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
    expect(loaded.config.layout.widgets).toEqual(["clock", "links"])
  })

  test("gives the stored config", async () => {
    const store = memoryStore()
    await saveConfig(store, mine)
    const loaded = await loadConfig(store)
    expect(loaded).toEqual({ config: (parseConfig(mine) as { config: unknown }).config })
  })

  test("falls back to the default with an error when the stored config is bad", async () => {
    const loaded = await loadConfig(memoryStore({ config: { version: 7 } }))
    expect(loaded.config.layout.widgets).toEqual(["clock", "links"])
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
    expect(seen).toEqual([["clock", "links"], ["links"]])
  })
})
