import type { ComponentType } from "preact"
import type { Config, Widget } from "../config"
import { useConfig } from "../config/useConfig"
import { Clock } from "../widgets/clock/Clock"
import { Links } from "../widgets/links/Links"

const widgets: Record<Widget, ComponentType<{ config: Config }>> = {
  clock: Clock,
  links: Links,
}

export function App() {
  const loaded = useConfig()
  if (!loaded) return null
  return (
    <main class="page">
      {loaded.error && (
        <p class="banner" role="alert">
          {loaded.error} <a href="options.html">Fix it on the options page.</a>
        </p>
      )}
      {loaded.config.layout.widgets.map((name) => {
        const Widget = widgets[name]
        return <Widget key={name} config={loaded.config} />
      })}
      <a class="edit" href="options.html">
        Edit
      </a>
    </main>
  )
}
