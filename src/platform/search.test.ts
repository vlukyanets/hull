import { afterEach, expect, test, vi } from "vitest"
import { search } from "./search"

afterEach(() => {
  vi.unstubAllGlobals()
})

// The search API as each browser has it, recording every call.
function firefox() {
  const calls: unknown[] = []
  vi.stubGlobal("browser", {
    search: {
      search: async (properties: unknown) => void calls.push(["search", properties]),
      query: async (info: unknown) => void calls.push(["query", info]),
    },
  })
  return calls
}

function chromium() {
  const calls: unknown[] = []
  vi.stubGlobal("browser", {
    search: { query: async (info: unknown) => void calls.push(["query", info]) },
  })
  return calls
}

test("searches with the named engine in Firefox, in this tab", async () => {
  const calls = firefox()
  await search("otters", "DuckDuckGo")
  expect(calls).toEqual([
    ["search", { query: "otters", engine: "DuckDuckGo", disposition: "CURRENT_TAB" }],
  ])
})

test("searches with the default engine in Firefox when none is named", async () => {
  const calls = firefox()
  await search("otters")
  expect(calls).toEqual([["search", { query: "otters", disposition: "CURRENT_TAB" }]])
})

test("searches with the default engine in Chromium, which cannot pick one", async () => {
  const calls = chromium()
  await search("otters", "DuckDuckGo")
  expect(calls).toEqual([["query", { text: "otters", disposition: "CURRENT_TAB" }]])
})

// Firefox with one engine, refusing every other name the way it does.
function firefoxWith(engine: string, error = `${engine} search failed`) {
  vi.stubGlobal("browser", {
    search: {
      get: async () => [{ name: engine, isDefault: true }],
      search: async (properties: { engine?: string }) => {
        throw new Error(properties.engine === engine ? error : `${properties.engine} was not found`)
      },
    },
  })
}

test("says that it is the search engine that was not found", async () => {
  firefoxWith("DuckDuckGo")
  await expect(search("otters", "Nope")).rejects.toThrow("Nope search engine was not found")
})

test("passes on any other error of the browser as it is", async () => {
  firefoxWith("DuckDuckGo", "Something else went wrong")
  await expect(search("otters", "DuckDuckGo")).rejects.toThrow("Something else went wrong")
})
