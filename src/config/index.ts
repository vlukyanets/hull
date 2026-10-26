import defaultToml from "./default.toml?raw"
import { parseConfig } from "./parse"
import type { Config } from "./schema"

export type { Config, Widget } from "./schema"

// The pages read the config only through this module. For now it is the
// default config; the stored one comes with the links grid.
export function loadConfig(): Config {
  const result = parseConfig(defaultToml)
  if (!result.ok) throw new Error(`default.toml: ${result.error}`)
  return result.config
}
