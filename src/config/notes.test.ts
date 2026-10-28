import { describe, expect, test } from "vitest"
import { memoryStore } from "./memoryStore"
import {
  addNote,
  loadNotes,
  removeNote,
  saveNotes,
  setNoteText,
  watchNotes,
  type Note,
} from "./notes"

const notes: Note[] = [
  { id: "a", text: "milk" },
  { id: "b", text: "Renew domain" },
]

describe("storing notes", () => {
  test("gives none on a first run", async () => {
    expect(await loadNotes(memoryStore())).toEqual([])
  })

  test("stores them as a list under their own key, apart from the config", async () => {
    const data: Record<string, unknown> = {}
    await saveNotes(memoryStore(data), notes)
    expect(data).toEqual({ notes })
    expect(await loadNotes(memoryStore(data))).toEqual(notes)
  })

  test("reads anything but a list of notes as none", async () => {
    for (const stored of ["one text", 42, [{ id: "a" }], [{ id: 1, text: "x" }], { id: "a", text: "x" }]) {
      expect(await loadNotes(memoryStore({ notes: stored }))).toEqual([])
    }
  })

  test("calls back with each save, and no more after the stop", async () => {
    const store = memoryStore()
    const seen: Note[][] = []
    const stop = watchNotes(store, (read) => seen.push(read))
    await saveNotes(store, notes)
    await store.set("config", {})
    stop()
    await saveNotes(store, [])
    expect(seen).toEqual([notes])
  })
})

describe("changing notes", () => {
  test("adds an empty note at the end", () => {
    expect(addNote(notes, "c")).toEqual([...notes, { id: "c", text: "" }])
  })

  test("changes the text of one note", () => {
    expect(setNoteText(notes, "b", "Renew domain before Nov 15")).toEqual([
      { id: "a", text: "milk" },
      { id: "b", text: "Renew domain before Nov 15" },
    ])
  })

  test("leaves the list as it is for a note that is gone", () => {
    expect(setNoteText(notes, "z", "x")).toEqual(notes)
  })

  test("removes one note", () => {
    expect(removeNote(notes, "a")).toEqual([{ id: "b", text: "Renew domain" }])
  })

  test("leaves the list it was given as it was", () => {
    addNote(notes, "c")
    setNoteText(notes, "a", "x")
    removeNote(notes, "a")
    expect(notes).toEqual([
      { id: "a", text: "milk" },
      { id: "b", text: "Renew domain" },
    ])
  })
})
