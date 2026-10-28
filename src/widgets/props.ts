import type { Config } from "../config"

// What the page gives every widget. A widget changes the config only by
// handing a new one to save, which stores it if it is valid and gives the
// reason if it is not.
export interface WidgetProps {
  config: Config
  editing: boolean
  save(config: Config): Promise<string | undefined>
}
