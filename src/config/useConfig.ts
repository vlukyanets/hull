import { useEffect, useState } from "preact/hooks"
import { browserStore, watchConfig, type Loaded, type Store } from "."

// The config for a page; undefined until it is read from storage.
export function useConfig(store: Store = browserStore): Loaded | undefined {
  const [loaded, setLoaded] = useState<Loaded>()
  useEffect(() => watchConfig(store, setLoaded), [store])
  return loaded
}
