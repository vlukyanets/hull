import type { Store } from "./store"

// The notes: sticky notes in the order shown, stored under a key of their
// own, apart from the config, so they stay out of the TOML export. The id
// tells two notes apart across tabs.
export interface Note {
  id: string
  text: string
}

const KEY = "notes"

const isNote = (value: unknown): value is Note =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Note).id === "string" &&
  typeof (value as Note).text === "string"

// Anything but a list of notes reads as none.
const read = (stored: unknown): Note[] =>
  Array.isArray(stored) && stored.every(isNote)
    ? stored.map(({ id, text }) => ({ id, text }))
    : []

export async function loadNotes(store: Store): Promise<Note[]> {
  return read(await store.get(KEY))
}

export function saveNotes(store: Store, notes: Note[]): Promise<void> {
  return store.set(KEY, notes)
}

// Calls back with the notes whenever they are saved, in any tab.
export function watchNotes(store: Store, callback: (notes: Note[]) => void): () => void {
  return store.onChange((key, value) => {
    if (key === KEY) callback(read(value))
  })
}

// The changes the page makes; each gives a new list.

export const addNote = (notes: Note[], id: string): Note[] => [...notes, { id, text: "" }]

export const setNoteText = (notes: Note[], id: string, text: string): Note[] =>
  notes.map((note) => (note.id === id ? { ...note, text } : note))

export const removeNote = (notes: Note[], id: string): Note[] =>
  notes.filter((note) => note.id !== id)
