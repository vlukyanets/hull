import { parse, TomlError } from "smol-toml"
import { WIDGETS, type Config, type Group, type Link, type Widget } from "./schema"

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
  return validateConfig(data)
}

// Checks parsed TOML, or a config read back from storage.
export function validateConfig(data: unknown): ParseResult {
  try {
    return { ok: true, config: validate(data) }
  } catch (e) {
    if (!(e instanceof Invalid)) throw e
    return { ok: false, error: e.message }
  }
}

function validate(data: unknown): Config {
  const root = table(data, "", ["version", "layout", "groups"])
  if (root.version !== 1) throw new Invalid("version: must be 1")
  const layout = table(root.layout, "layout", ["widgets"])
  return {
    version: 1,
    layout: { widgets: widgets(layout.widgets) },
    groups: list(root.groups ?? [], "groups").map(group),
  }
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

function list(value: unknown, path: string): [unknown, string][] {
  if (value === undefined) throw new Invalid(`${path}: missing`)
  if (!Array.isArray(value)) throw new Invalid(`${path}: must be a list`)
  return value.map((item, i) => [item, `${path}[${i}]`])
}

function name(value: unknown, path: string): string {
  if (typeof value !== "string") throw new Invalid(`${path}: must be text`)
  if (value.trim() === "") throw new Invalid(`${path}: must not be empty`)
  return value
}

function widgets(value: unknown): Widget[] {
  const all = list(value, "layout.widgets").map(([item]) => item)
  return all.map((item, i) => {
    const path = `layout.widgets[${i}]`
    if (!WIDGETS.includes(item as Widget)) {
      throw new Invalid(`${path}: unknown widget ${JSON.stringify(item)}`)
    }
    if (all.indexOf(item) !== i) {
      throw new Invalid(`${path}: "${item}" is listed twice`)
    }
    return item as Widget
  })
}

function group([value, path]: [unknown, string]): Group {
  const t = table(value, path, ["name", "links"])
  return {
    name: name(t.name, `${path}.name`),
    links: list(t.links ?? [], `${path}.links`).map(link),
  }
}

function link([value, path]: [unknown, string]): Link {
  const t = table(value, path, ["name", "url"])
  return { name: name(t.name, `${path}.name`), url: url(t.url, `${path}.url`) }
}

// Only http and https: a link must never run code (javascript:) or carry
// a document of its own (data:).
function url(value: unknown, path: string): string {
  const parsed = typeof value === "string" ? URL.parse(value) : null
  if (parsed?.protocol !== "http:" && parsed?.protocol !== "https:") {
    throw new Invalid(`${path}: must be an http or https URL`)
  }
  return value as string
}
