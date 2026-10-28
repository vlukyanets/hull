import { stringify } from "smol-toml"
import defaultToml from "./default.toml?raw"
import { parseConfig, validateConfig, type ParseResult } from "./parse"
import type { Config } from "./schema"
import type { Store } from "./store"

export type { Config, Group, Link, Widget } from "./schema"
export type { ParseResult } from "./parse"
export { nameProblem } from "./parse"
export * from "./edit"
export { browserStore, type Store } from "./store"

// The pages read and write the config only through this module. It is kept
// in storage under one key, as the checked config, not as TOML text.
const KEY = "config"

// error: the stored config was bad, and config is the default instead.
export interface Loaded {
  config: Config
  error?: string
}

function defaultConfig(): Config {
  const result = parseConfig(defaultToml)
  if (!result.ok) throw new Error(`default.toml: ${result.error}`)
  return result.config
}

function check(stored: unknown): Loaded {
  if (stored === undefined) return { config: defaultConfig() }
  const result = validateConfig(stored)
  if (result.ok) return { config: result.config }
  return {
    config: defaultConfig(),
    error: `The saved config is not valid (${result.error}), so hull shows the default one.`,
  }
}

export async function loadConfig(store: Store): Promise<Loaded> {
  return check(await store.get(KEY))
}

// Stores the config only when the TOML is valid.
export async function saveConfig(store: Store, toml: string): Promise<ParseResult> {
  const result = parseConfig(toml)
  if (result.ok) await store.set(KEY, result.config)
  return result
}

// The same for a config changed in edit mode, checked as TOML would be.
export async function storeConfig(store: Store, config: Config): Promise<ParseResult> {
  const result = validateConfig(config)
  if (result.ok) await store.set(KEY, result.config)
  return result
}

export function configToml(config: Config): string {
  return stringify(config)
}

// Calls back with the config now and again whenever it is saved, in any tab.
export function watchConfig(store: Store, callback: (loaded: Loaded) => void): () => void {
  let stopped = false
  const stop = store.onChange((key, value) => {
    if (key === KEY) callback(check(value))
  })
  loadConfig(store).then((loaded) => {
    if (!stopped) callback(loaded)
  })
  return () => {
    stopped = true
    stop()
  }
}
