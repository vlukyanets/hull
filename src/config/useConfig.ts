import { useEffect, useState } from "preact/hooks"
import { browserStore, loadConfig, watchConfig, type Loaded, type Store } from "."

// The config for a page; undefined until it is read from storage.
export function useConfig(store: Store = browserStore): Loaded | undefined {
  const [loaded, setLoaded] = useState<Loaded>()
  useEffect(() => {
    const stop = watchConfig(store, setLoaded)
    // A page the browser keeps for Back is frozen and misses the saves made
    // meanwhile, such as on the options page; read again when it returns.
    const onPageshow = (event: PageTransitionEvent) => {
      if (event.persisted) loadConfig(store).then(setLoaded)
    }
    addEventListener("pageshow", onPageshow)
    return () => {
      stop()
      removeEventListener("pageshow", onPageshow)
    }
  }, [store])
  return loaded
}
