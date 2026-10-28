// @vitest-environment happy-dom
import { render } from "preact"
import { afterEach, expect, test } from "vitest"
import type { Config, Store } from "../../config"
import { memoryStore } from "../../config/memoryStore"
import { saveNotes, type Note } from "../../config/notes"
import { until } from "../../until"
import { Notes } from "./Notes"

const config: Config = { version: 1, layout: { widgets: ["notes"] }, groups: [] }

afterEach(() => {
  for (const root of document.body.children) render(null, root)
  document.body.replaceChildren()
})

// Draws the widget into the document, so a note can take focus, and waits
// for it: it is drawn once the notes are read.
async function drawn(store: Store, editing = false) {
  const root = document.createElement("div")
  document.body.append(root)
  render(<Notes config={config} editing={editing} save={async () => undefined} store={store} />, root)
  await until(() => {
    if (!root.querySelector(".note-add")) throw new Error("the notes are not read")
  })
  return root
}

const boxes = (root: Element) => [...root.querySelectorAll<HTMLTextAreaElement>(".note textarea")]
const status = (root: Element) => root.querySelector(".notes-status")!.textContent
const stored = (data: Record<string, unknown>) => (data.notes as Note[]).map((n) => n.text)
const type = (box: HTMLTextAreaElement, text: string) => {
  box.value = text
  box.dispatchEvent(new Event("input", { bubbles: true }))
}
const button = (root: Element, label: string) =>
  [...root.querySelectorAll("button")].find(
    (b) => b.textContent === label || b.getAttribute("aria-label") === label,
  )!

test("shows each stored note as a card", async () => {
  const root = await drawn(memoryStore({ notes: [{ id: "a", text: "milk" }, { id: "b", text: "NAS" }] }))
  await until(() => expect(boxes(root).map((b) => b.value)).toEqual(["milk", "NAS"]))
})

test("adds a note, puts the cursor in it, and saves it after a pause", async () => {
  const data: Record<string, unknown> = {}
  const root = await drawn(memoryStore(data))

  button(root, "Add a note").click()
  await until(() => expect(boxes(root)).toHaveLength(1))
  await until(() => expect(document.activeElement).toBe(boxes(root)[0]))

  type(boxes(root)[0], "batteries")
  await until(() => expect(status(root)).toBe("Saving..."))
  await until(() => expect(status(root)).toBe("Saved"))
  expect(stored(data)).toEqual(["batteries"])
})

test("saves at once when a note is left", async () => {
  const data: Record<string, unknown> = { notes: [{ id: "a", text: "" }] }
  const root = await drawn(memoryStore(data))
  const box = boxes(root)[0]
  box.focus()
  type(box, "coffee")
  box.blur()
  // Well before the pause would end: only leaving the note saved it.
  await new Promise((r) => setTimeout(r))
  expect(stored(data)).toEqual(["coffee"])
})

test("asks before removing a note with text, not an empty one", async () => {
  const data: Record<string, unknown> = {
    notes: [{ id: "a", text: "milk" }, { id: "b", text: "" }],
  }
  const root = await drawn(memoryStore(data))
  await until(() => expect(boxes(root)).toHaveLength(2))

  const notes = () => [...root.querySelectorAll(".note")]
  ;(notes()[1].querySelector("button[aria-label='Remove the note']") as HTMLButtonElement).click()
  await until(() => expect(stored(data)).toEqual(["milk"]))

  ;(notes()[0].querySelector("button[aria-label='Remove the note']") as HTMLButtonElement).click()
  await until(() => expect(notes()[0].textContent).toContain("Remove this note?"))
  button(root, "Keep").click()
  await until(() => expect(notes()[0].textContent).not.toContain("Remove this note?"))
  expect(stored(data)).toEqual(["milk"])

  ;(notes()[0].querySelector("button[aria-label='Remove the note']") as HTMLButtonElement).click()
  await until(() => expect(button(root, "Remove")).toBeTruthy())
  button(root, "Remove").click()
  await until(() => expect(stored(data)).toEqual([]))
})

test("takes a save from another tab, but not into the note with the cursor", async () => {
  const store = memoryStore({ notes: [{ id: "a", text: "one" }, { id: "b", text: "x" }] })
  const root = await drawn(store)
  await until(() => expect(boxes(root)).toHaveLength(2))

  boxes(root)[0].focus()
  await saveNotes(store, [{ id: "a", text: "two" }, { id: "b", text: "y" }])
  await until(() => expect(boxes(root)[1].value).toBe("y"))
  expect(boxes(root)[0].value).toBe("one")
})

test("is off in edit mode", async () => {
  const root = await drawn(memoryStore({ notes: [{ id: "a", text: "one" }] }), true)
  await until(() => expect(boxes(root)).toHaveLength(1))
  expect(boxes(root)[0].disabled).toBe(true)
  expect(button(root, "Add a note").disabled).toBe(true)
})
