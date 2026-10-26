import { parse, TomlError } from "smol-toml"
import { WIDGETS, type Config, type Widget } from "./schema"

export type ParseResult =
  | { ok: true; config: Config }
  | { ok: false; error: string }

// Thrown inside validate with the path of the key and the reason, such as
// "layout.widgets[1]: unknown widget".
class Invalid extends Error {}

export function parseConfig(text: string): ParseResult {
  let data: unknown
  try {
    data = parse(text)
  } catch (e) {
    if (!(e instanceof TomlError)) throw e
    // The message goes on with a quote of the document; keep its first line.
    const reason = e.message.split("\n")[0].replace(/^Invalid TOML document: /, "")
    return { ok: false, error: `line ${e.line}, column ${e.column}: ${reason}` }
  }
  try {
    return { ok: true, config: validate(data) }
  } catch (e) {
    if (!(e instanceof Invalid)) throw e
    return { ok: false, error: e.message }
  }
}

function validate(data: unknown): Config {
  const root = table(data, "", ["version", "layout"])
  if (root.version !== 1) throw new Invalid("version: must be 1")
  const layout = table(root.layout, "layout", ["widgets"])
  return { version: 1, layout: { widgets: widgets(layout.widgets) } }
}

function table(
  value: unknown,
  path: string,
  keys: string[],
): Record<string, unknown> {
  if (value === undefined) throw new Invalid(`${path}: missing`)
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Invalid(`${path}: must be a table`)
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) {
      throw new Invalid(`${path ? `${path}.` : ""}${key}: unknown key`)
    }
  }
  return value as Record<string, unknown>
}

function widgets(value: unknown): Widget[] {
  const path = "layout.widgets"
  if (value === undefined) throw new Invalid(`${path}: missing`)
  if (!Array.isArray(value)) throw new Invalid(`${path}: must be a list`)
  return value.map((name, i) => {
    if (!WIDGETS.includes(name)) {
      throw new Invalid(`${path}[${i}]: unknown widget ${JSON.stringify(name)}`)
    }
    if (value.indexOf(name) !== i) {
      throw new Invalid(`${path}[${i}]: "${name}" is listed twice`)
    }
    return name
  })
}
