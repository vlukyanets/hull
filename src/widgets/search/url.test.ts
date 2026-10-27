import { expect, test } from "vitest"
import { searchUrl } from "./url"

test("puts the query in place of %s", () => {
  expect(searchUrl("https://duckduckgo.com/?q=%s", "otters")).toBe(
    "https://duckduckgo.com/?q=otters",
  )
})

test("encodes the query, so it cannot add parameters of its own", () => {
  expect(searchUrl("https://duckduckgo.com/?q=%s", "cats & dogs?x=1#top")).toBe(
    "https://duckduckgo.com/?q=cats%20%26%20dogs%3Fx%3D1%23top",
  )
})

test("fills every %s", () => {
  expect(searchUrl("https://example.com/%s?q=%s", "a b")).toBe(
    "https://example.com/a%20b?q=a%20b",
  )
})
