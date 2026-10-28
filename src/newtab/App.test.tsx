// @vitest-environment happy-dom
import { render } from "preact"
import { afterEach, expect, test } from "vitest"
import { memoryStore } from "../config/memoryStore"
import { App } from "./App"

const settle = () => new Promise((r) => setTimeout(r, 10))

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
  await settle()
  root.querySelector<HTMLButtonElement>("button.edit")!.click()
  await settle()
  return root
}

// Opens the dialog to add a link to the first group and fills it in.
async function addLink(root: HTMLElement, name: string, url: string) {
  root.querySelector<HTMLButtonElement>(".tile-add")!.click()
  await settle()
  const dialog = root.querySelector("dialog")!
  dialog.querySelector<HTMLInputElement>("input[name=name]")!.value = name
  dialog.querySelector<HTMLInputElement>("input[name=url]")!.value = url
  dialog.querySelector("form")!.requestSubmit()
  await settle()
  return dialog
}

test("adds a link from the dialog and stores it", async () => {
  const data: Record<string, unknown> = { config: structuredClone(config) }
  const root = await editing(data)

  const dialog = await addLink(root, "NAS", " https://nas.lan ")

  expect(dialog.open).toBe(false)
  expect((data.config as typeof config).groups[0].links).toEqual([
    { name: "Router", url: "http://192.168.1.1" },
    { name: "NAS", url: "https://nas.lan" },
  ])
  expect(root.querySelector(".tiles")!.textContent).toContain("NAS")
})

test("keeps the dialog open and stores nothing when a field is bad", async () => {
  const data: Record<string, unknown> = { config: structuredClone(config) }
  const root = await editing(data)

  const dialog = await addLink(root, " ", "https://nas.lan")

  expect(dialog.open).toBe(true)
  expect(dialog.querySelector(".field-error")!.textContent).toBe("Name: must not be empty")
  expect(data.config).toEqual(config)
})

test("ends edit mode on Escape, but not while a dialog is open", async () => {
  const root = await editing({ config: structuredClone(config) })
  const escape = () => dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))

  root.querySelector<HTMLButtonElement>(".tile-add")!.click()
  await settle()
  escape()
  await settle()
  expect(root.querySelector(".links.editing")).not.toBeNull()

  root.querySelector("dialog")!.close()
  await settle()
  escape()
  await settle()
  expect(root.querySelector(".links.editing")).toBeNull()
  expect(root.querySelector("button.edit")!.textContent).toBe("Edit")
})
