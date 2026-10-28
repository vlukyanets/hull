// @vitest-environment happy-dom
import { render } from "preact"
import { expect, test } from "vitest"
import { memoryStore } from "../config/memoryStore"
import { until } from "../until"
import { Options } from "./Options"

// Draws the page and waits for the editor: Preact fills it in an effect,
// after a frame, which a busy machine can put off longer than any fixed
// wait.
async function drawn(data: Record<string, unknown>) {
  const root = document.createElement("div")
  render(<Options store={memoryStore(data)} />, root)
  const textarea = await until(() => {
    const found = root.querySelector("textarea")
    if (!found) throw new Error("the editor is not drawn")
    return found
  })
  return { root, textarea }
}

const status = (root: Element) => root.querySelector(".status")!.textContent

test("saves the text typed just before the form is sent", async () => {
  const data: Record<string, unknown> = {}
  const { root, textarea } = await drawn(data)

  // Type and send in one go, before the page draws again: a paste followed
  // by Enter at once.
  textarea.value = 'version = 1\n[layout]\nwidgets = ["clock"]\n'
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  root.querySelector("form")!.requestSubmit()

  await until(() => expect(status(root)).toBe("Saved."))
  expect(data.config).toEqual({
    version: 1,
    layout: { widgets: ["clock"] },
    groups: [],
  })
})

test("saves nothing and says why when the text is bad", async () => {
  const data: Record<string, unknown> = {}
  const { root, textarea } = await drawn(data)

  textarea.value = "version = 2\n[layout]\nwidgets = []\n"
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  root.querySelector("form")!.requestSubmit()

  await until(() => expect(status(root)).toBe("Not saved: version: must be 1"))
  expect(data).toEqual({})
})

// Picks a file in the import field, as the file dialog does.
function pick(root: HTMLElement, text: string) {
  const input = root.querySelector<HTMLInputElement>("input[type=file]")!
  const file = new File([text], "hull.toml", { type: "application/toml" })
  Object.defineProperty(input, "files", { value: [file], configurable: true })
  input.dispatchEvent(new Event("change", { bubbles: true }))
}

test("saves an imported file at once and shows it in the editor", async () => {
  const data: Record<string, unknown> = {}
  const { root, textarea } = await drawn(data)

  // Unsaved text in the editor is replaced by the import.
  textarea.value = "not saved"
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  pick(root, '# mine\nversion = 1\n[layout]\nwidgets = ["links"]\n')

  await until(() => expect(status(root)).toBe("Imported hull.toml."))
  expect(data.config).toEqual({ version: 1, layout: { widgets: ["links"] }, groups: [] })
  expect(root.querySelector("textarea")!.value).toContain('widgets = [ "links" ]')
})

test("imports nothing and says why when the file is bad", async () => {
  const data: Record<string, unknown> = {}
  const { root, textarea } = await drawn(data)
  const before = textarea.value

  pick(root, "version = 2\n[layout]\nwidgets = []\n")

  await until(() => expect(status(root)).toBe("Not imported: version: must be 1"))
  expect(data).toEqual({})
  expect(root.querySelector("textarea")!.value).toBe(before)
})

const back = (root: Element) => {
  const link = root.querySelector<HTMLAnchorElement>("a.back")!
  return [link.textContent, link.getAttribute("href")]
}

test("leads back to editing when opened from edit mode's Settings", async () => {
  history.replaceState(null, "", "#edit")
  const { root } = await drawn({})
  expect(back(root)).toEqual(["Back to editing", "newtab.html#edit"])
})

test("leads back to the new tab when opened another way", async () => {
  history.replaceState(null, "", location.pathname)
  const { root } = await drawn({})
  expect(back(root)).toEqual(["Back to the new tab", "newtab.html"])
})
