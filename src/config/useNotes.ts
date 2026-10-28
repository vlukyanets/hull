import { useEffect, useState } from "preact/hooks"
import { loadNotes, watchNotes, type Note } from "./notes"
import type { Store } from "./store"

// The notes for a page, following every save in any tab; undefined until
// they are read from storage.
export function useNotes(store: Store): Note[] | undefined {
  const [notes, setNotes] = useState<Note[]>()
  useEffect(() => {
    let stopped = false
    const stop = watchNotes(store, setNotes)
    loadNotes(store).then((read) => {
      if (!stopped) setNotes(read)
    })
    // A page kept for Back missed the saves meanwhile, as with the config.
    const onPageshow = (event: PageTransitionEvent) => {
      if (event.persisted) loadNotes(store).then(setNotes)
    }
    addEventListener("pageshow", onPageshow)
    return () => {
      stopped = true
      stop()
      removeEventListener("pageshow", onPageshow)
    }
  }, [store])
  return notes
}
