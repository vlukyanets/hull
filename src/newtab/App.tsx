import type { ComponentType } from "preact"
import { useEffect, useState } from "preact/hooks"
import { browserStore, storeConfig, type Config, type Store, type Widget } from "../config"
import { useConfig } from "../config/useConfig"
import { Clock } from "../widgets/clock/Clock"
import { Links } from "../widgets/links/Links"
import type { WidgetProps } from "../widgets/props"
import { Search } from "../widgets/search/Search"

const widgets: Record<Widget, ComponentType<WidgetProps>> = {
  clock: Clock,
  search: Search,
  links: Links,
}

// store: storage.local, or a store in memory in tests.
export function App({ store = browserStore }: { store?: Store }) {
  const loaded = useConfig(store)
  const [editing, setEditing] = useState(false)

  // Escape ends edit mode, unless it closes a dialog.
  useEffect(() => {
    if (!editing) return
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) setEditing(false)
    }
    addEventListener("keydown", onKeydown)
    return () => removeEventListener("keydown", onKeydown)
  }, [editing])

  if (!loaded) return null

  async function save(config: Config) {
    const result = await storeConfig(store, config)
    return result.ok ? undefined : result.error
  }

  return (
    <main class="page">
      {loaded.error && (
        <p class="banner" role="alert">
          {loaded.error} <a href="options.html">Fix it on the options page.</a>
        </p>
      )}
      {loaded.config.layout.widgets.map((name) => {
        const Widget = widgets[name]
        return <Widget key={name} config={loaded.config} editing={editing} save={save} />
      })}
      <nav class="corner">
        {editing && <a href="options.html">Settings</a>}
        <button type="button" class="edit" onClick={() => setEditing(!editing)}>
          {editing ? "Done" : "Edit"}
        </button>
      </nav>
    </main>
  )
}
