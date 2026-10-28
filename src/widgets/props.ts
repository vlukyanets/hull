import type { Config, Store } from "../config"

// What the page gives every widget. A widget changes the config only by
// handing a new one to save, which stores it if it is valid and gives the
// reason if it is not. store is for data of a widget's own, such as the
// notes, read and written only through src/config/.
export interface WidgetProps {
  config: Config
  editing: boolean
  save(config: Config): Promise<string | undefined>
  store: Store
}
