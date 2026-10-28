import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks"
import { addNote, removeNote, saveNotes, setNoteText, type Note } from "../../config/notes"
import { useNotes } from "../../config/useNotes"
import type { WidgetProps } from "../props"
import { NoteCard } from "./NoteCard"

// A note is saved this long after typing stops: the owner chose a pause
// over a save on every key.
const PAUSE = 500

// Sticky notes, typed right on the card; off in edit mode.
export function Notes({ editing, store }: WidgetProps) {
  const notes = useNotes(store)
  // The list as last stored or saved here, and the text typed per note and
  // not saved yet, with the timer that will save it.
  const current = useRef<Note[]>([])
  const pending = useRef(new Map<string, string>())
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [status, setStatus] = useState<"saving" | "saved">()
  const [focus, setFocus] = useState<string>()

  useLayoutEffect(() => {
    if (notes) current.current = notes
  }, [notes])

  // Saves what was typed, with a change to the list if there is one.
  async function commit(change?: (notes: Note[]) => Note[]) {
    clearTimeout(timer.current)
    timer.current = undefined
    if (!change && pending.current.size === 0) return
    let list = current.current
    for (const [id, text] of pending.current) list = setNoteText(list, id, text)
    pending.current.clear()
    if (change) list = change(list)
    current.current = list
    await saveNotes(store, list)
    // Typing that went on during the save keeps "Saving...".
    if (pending.current.size === 0) setStatus("saved")
  }

  function onInput(id: string, text: string) {
    pending.current.set(id, text)
    setStatus("saving")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void commit(), PAUSE)
  }

  async function add() {
    const id = crypto.randomUUID()
    await commit((list) => addNote(list, id))
    setFocus(id)
  }

  function remove(id: string) {
    pending.current.delete(id)
    void commit((list) => removeNote(list, id))
  }

  // Closing the tab, or the widget going away, does not wait for the pause.
  useEffect(() => {
    const onPagehide = () => void commit()
    addEventListener("pagehide", onPagehide)
    return () => {
      removeEventListener("pagehide", onPagehide)
      void commit()
    }
  }, [store])

  if (notes === undefined) return null
  return (
    <section class="notes" aria-labelledby="notes-title">
      <div class="notes-head">
        <h2 id="notes-title">Notes</h2>
        <span class="notes-status" aria-live="polite">
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : ""}
        </span>
      </div>
      <ul class="notes-grid">
        {notes.map((note, i) => (
          <NoteCard
            key={note.id}
            note={note}
            index={i}
            disabled={editing}
            focus={focus === note.id}
            isPending={(id) => pending.current.has(id)}
            onInput={onInput}
            onLeave={() => void commit()}
            onRemove={remove}
          />
        ))}
        <li>
          <button
            type="button"
            class="note-add"
            aria-label="Add a note"
            disabled={editing}
            onClick={() => void add()}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Note
          </button>
        </li>
      </ul>
    </section>
  )
}
