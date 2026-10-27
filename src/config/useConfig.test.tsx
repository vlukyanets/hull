// @vitest-environment happy-dom
import { render } from "preact"
import { expect, test } from "vitest"
import { memoryStore } from "./memoryStore"
import { parseConfig } from "./parse"
import { useConfig } from "./useConfig"
import type { Store } from "./store"

const settle = () => new Promise((r) => setTimeout(r, 10))

function Widgets({ store }: { store: Store }) {
  const loaded = useConfig(store)
  return <p>{loaded?.config.layout.widgets.join(",")}</p>
}

// The browser restored the page from the back-forward cache.
function pageshowFromCache() {
  const event = new Event("pageshow")
  Object.defineProperty(event, "persisted", { value: true })
  window.dispatchEvent(event)
}

test("reads the config again when the page comes back from the cache", async () => {
  const data: Record<string, unknown> = {}
  const root = document.createElement("div")
  render(<Widgets store={memoryStore(data)} />, root)
  await settle()
  expect(root.textContent).toBe("clock,search,links")

  // Saved in another page while this one was in the cache, so this one
  // never heard of it.
  const result = parseConfig('version = 1\n[layout]\nwidgets = ["links"]\n')
  if (result.ok) data.config = result.config
  pageshowFromCache()
  await settle()

  expect(root.textContent).toBe("links")
})
