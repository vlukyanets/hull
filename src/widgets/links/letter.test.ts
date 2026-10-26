import { expect, test } from "vitest"
import { firstLetter } from "./letter"

test("takes the first letter of the name, in capitals", () => {
  expect(firstLetter("router")).toBe("R")
  expect(firstLetter("  nas")).toBe("N")
  expect(firstLetter("dzherelo")).toBe("D")
})

test("keeps a character that takes two code units whole", () => {
  expect(firstLetter("\u{1F680} launch")).toBe("\u{1F680}")
})
