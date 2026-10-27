// @vitest-environment happy-dom
import { render } from "preact"
import { expect, test } from "vitest"
import { memoryStore } from "../config/memoryStore"
import { Options } from "./Options"

const settle = () => new Promise((r) => setTimeout(r, 10))

test("saves the text typed just before the form is sent", async () => {
  const data: Record<string, unknown> = {}
  const root = document.createElement("div")
  render(<Options store={memoryStore(data)} />, root)
  await settle()

  // Type and send in one go, before the page draws again: a paste followed
  // by Enter at once.
  const textarea = root.querySelector("textarea")!
  textarea.value = 'version = 1\n[layout]\nwidgets = ["clock"]\n'
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  root.querySelector("form")!.requestSubmit()
  await settle()

  expect(data.config).toEqual({
    version: 1,
    layout: { widgets: ["clock"] },
    groups: [],
  })
  expect(root.querySelector(".status")!.textContent).toBe("Saved.")
})

test("saves nothing and says why when the text is bad", async () => {
  const data: Record<string, unknown> = {}
  const root = document.createElement("div")
  render(<Options store={memoryStore(data)} />, root)
  await settle()

  const textarea = root.querySelector("textarea")!
  textarea.value = "version = 2\n[layout]\nwidgets = []\n"
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  root.querySelector("form")!.requestSubmit()
  await settle()

  expect(data).toEqual({})
  expect(root.querySelector(".status")!.textContent).toBe("Not saved: version: must be 1")
})
