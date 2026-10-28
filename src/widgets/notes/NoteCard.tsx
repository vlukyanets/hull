import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks"
import type { Note } from "../../config/notes"

interface Props {
  note: Note
  index: number
  disabled: boolean
  // Put the cursor in it: a note just added.
  focus: boolean
  // Whether the note has text typed and not saved yet.
  isPending(id: string): boolean
  onInput(id: string, text: string): void
  onLeave(): void
  onRemove(id: string): void
}

// One sticky note. A note with text asks before it goes; an empty one
// goes at once.
export function NoteCard({ note, index, disabled, focus, isPending, onInput, onLeave, onRemove }: Props) {
  const box = useRef<HTMLTextAreaElement>(null)
  const keep = useRef<HTMLButtonElement>(null)
  const [asking, setAsking] = useState(false)

  // The stored text, and a save from another tab, go into the note, but
  // never under the cursor or over text not saved yet. Before paint, so
  // the note never shows empty first.
  useLayoutEffect(() => {
    const el = box.current
    if (!el || document.activeElement === el || isPending(note.id)) return
    el.value = note.text
  }, [note.text])

  useEffect(() => {
    if (focus) box.current?.focus()
  }, [focus])

  useEffect(() => {
    if (asking) keep.current?.focus()
  }, [asking])

  function remove() {
    if (box.current?.value.trim()) setAsking(true)
    else onRemove(note.id)
  }

  return (
    <li class="note">
      <textarea
        ref={box}
        aria-label={`Note ${index + 1}`}
        disabled={disabled}
        onInput={(event) => onInput(note.id, event.currentTarget.value)}
        onBlur={onLeave}
      />
      {!disabled && (
        <button type="button" class="note-remove" aria-label="Remove the note" onClick={remove}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
      {asking && (
        <div class="note-question" role="alertdialog" aria-labelledby={`note-${note.id}-q`}>
          <p id={`note-${note.id}-q`}>Remove this note?</p>
          <div>
            <button type="button" class="button" ref={keep} onClick={() => setAsking(false)}>
              Keep
            </button>
            <button type="button" class="button button-danger-strong" onClick={() => onRemove(note.id)}>
              Remove
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
