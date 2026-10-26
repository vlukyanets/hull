import type { ComponentType } from "preact"
import type { Config, Widget } from "../config"
import { Clock } from "../widgets/clock/Clock"

const widgets: Record<Widget, ComponentType> = {
  clock: Clock,
}

export function App({ config }: { config: Config }) {
  return (
    <main class="page">
      {config.layout.widgets.map((name) => {
        const Widget = widgets[name]
        return <Widget key={name} />
      })}
    </main>
  )
}
