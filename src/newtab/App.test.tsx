// @vitest-environment happy-dom
import { render } from "preact"
import { afterEach, expect, test } from "vitest"
import { memoryStore } from "../config/memoryStore"
import { until } from "../until"
import { App } from "./App"

// Waits for the page to draw: Preact runs effects after a frame, which a
// busy machine can put off longer than any fixed wait.
function find<T extends Element>(root: Element, selector: string) {
  return until(() => {
    const found = root.querySelector<T>(selector)
    if (!found) throw new Error(`${selector} is not drawn`)
    return found
  })
}

// The page is drawn into the document, so a dialog can open; a dialog left
// open by one test must not count in the next.
afterEach(() => {
  for (const root of document.body.children) render(null, root)
  document.body.replaceChildren()
})

const config = {
  version: 1,
  layout: { widgets: ["links"] },
  groups: [{ name: "Home", links: [{ name: "Router", url: "http://192.168.1.1" }] }],
}

async function editing(data: Record<string, unknown>) {
  const root = document.createElement("div")
  document.body.append(root)
  render(<App store={memoryStore(data)} />, root)
  ;(await find<HTMLButtonElement>(root, "button.edit")).click()
  await find(root, ".links.editing")
  return root
}

// Opens the dialog to add a link to the first group.
async function openAdd(root: Element) {
  ;(await find<HTMLButtonElement>(root, ".tile-add")).click()
  return find<HTMLDialogElement>(root, "dialog[open]")
}

async function addLink(root: Element, name: string, url: string) {
  const dialog = await openAdd(root)
  dialog.querySelector<HTMLInputElement>("input[name=name]")!.value = name
  dialog.querySelector<HTMLInputElement>("input[name=url]")!.value = url
  dialog.querySelector("form")!.requestSubmit()
  return dialog
}

test("adds a link from the dialog and stores it", async () => {
  const data: Record<string, unknown> = { config: structuredClone(config) }
  const root = await editing(data)

  const dialog = await addLink(root, "NAS", " https://nas.lan ")

  await until(() => expect(dialog.open).toBe(false))
  expect((data.config as typeof config).groups[0].links).toEqual([
    { name: "Router", url: "http://192.168.1.1" },
    { name: "NAS", url: "https://nas.lan" },
  ])
  await until(() => expect(root.querySelector(".tiles")!.textContent).toContain("NAS"))
})

test("keeps the dialog open and stores nothing when a field is bad", async () => {
  const data: Record<string, unknown> = { config: structuredClone(config) }
  const root = await editing(data)

  const dialog = await addLink(root, " ", "https://nas.lan")

  const error = await find(dialog, ".field-error")
  expect(error.textContent).toBe("Name: must not be empty")
  expect(dialog.open).toBe(true)
  expect(data.config).toEqual(config)
})

test("ends edit mode on Escape, but not while a dialog is open", async () => {
  const root = await editing({ config: structuredClone(config) })
  const escape = () => dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))

  const dialog = await openAdd(root)
  escape()
  dialog.close()
  // The page has drawn the dialog closed, so it has drawn whatever the
  // Escape before it did as well.
  await until(() => expect(root.querySelector("dialog")).toBeNull())
  expect(root.querySelector(".links.editing")).not.toBeNull()

  escape()
  await until(() => expect(root.querySelector(".links.editing")).toBeNull())
  expect(root.querySelector("button.edit")!.textContent).toBe("Edit")
})

test("starts in edit mode when opened from the options page's Back to editing", async () => {
  history.replaceState(null, "", "#edit")
  const root = document.createElement("div")
  document.body.append(root)
  render(<App store={memoryStore({ config: structuredClone(config) })} />, root)

  await find(root, ".links.editing")
  // A reload after that starts as usual.
  expect(location.hash).toBe("")
  expect(root.querySelector<HTMLAnchorElement>(".corner a")!.getAttribute("href")).toBe(
    "options.html#edit",
  )
})

// The button of the open dialog with this text.
const button = (dialog: Element, text: string) =>
  until(() => {
    const found = [...dialog.querySelectorAll("button")].find((b) => b.textContent === text)
    if (!found) throw new Error(`no ${text} button`)
    return found
  })

test("asks before removing a group with links, and Escape goes back", async () => {
  const data: Record<string, unknown> = { config: structuredClone(config) }
  const root = await editing(data)
  ;(await find<HTMLButtonElement>(root, ".group-name button")).click()
  const dialog = await find<HTMLDialogElement>(root, "dialog[open]")

  ;(await button(dialog, "Remove")).click()
  const question = await find(dialog, "[role=alertdialog] h2")
  await until(() => expect(question.textContent).toBe("Remove Home and its 1 link?"))
  expect(data.config).toEqual(config)

  // Escape leaves the question for the group, not the dialog.
  const cancel = new Event("cancel", { cancelable: true })
  dialog.dispatchEvent(cancel)
  expect(cancel.defaultPrevented).toBe(true)
  await until(() => expect(dialog.querySelector("[role=alertdialog]")).toBeNull())
  expect(dialog.querySelector("form")!.hidden).toBe(false)

  ;(await button(dialog, "Remove")).click()
  ;(await button(dialog, "Yes, remove")).click()
  await until(() => expect((data.config as typeof config).groups).toEqual([]))
})
