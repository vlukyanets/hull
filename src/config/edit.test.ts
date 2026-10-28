import { describe, expect, test } from "vitest"
import {
  addGroup,
  addLink,
  moveGroup,
  moveLink,
  removeGroup,
  removeLink,
  renameGroup,
  setLink,
} from "./edit"
import type { Config } from "./schema"

const link = (name: string) => ({ name, url: `https://${name.toLowerCase()}.lan` })

const config: Config = {
  version: 1,
  layout: { widgets: ["links"] },
  groups: [
    { name: "Home", links: [link("A"), link("B"), link("C")] },
    { name: "Work", links: [link("X")] },
  ],
}

// The names of the links, group by group.
const names = (c: Config) => c.groups.map((g) => `${g.name}: ${g.links.map((l) => l.name).join("")}`)

describe("links", () => {
  test("adds a link at the end of a group", () => {
    expect(names(addLink(config, 1, link("Y")))).toEqual(["Home: ABC", "Work: XY"])
  })

  test("changes a link", () => {
    const changed = setLink(config, { group: 0, index: 1 }, link("Z"))
    expect(changed.groups[0].links[1]).toEqual(link("Z"))
  })

  test("removes a link", () => {
    expect(names(removeLink(config, { group: 0, index: 0 }))).toEqual(["Home: BC", "Work: X"])
  })

  test("leaves the config it was given as it was", () => {
    removeLink(config, { group: 0, index: 0 })
    moveLink(config, { group: 0, index: 0 }, { group: 1, index: 0 })
    expect(names(config)).toEqual(["Home: ABC", "Work: X"])
  })
})

// A link dropped on another takes its place; one dropped at the end of a
// group, at the index after its last link, goes last.
describe("moveLink", () => {
  test("moves a link later in its group", () => {
    expect(names(moveLink(config, { group: 0, index: 0 }, { group: 0, index: 1 }))).toEqual([
      "Home: BAC",
      "Work: X",
    ])
  })

  test("moves a link earlier in its group", () => {
    expect(names(moveLink(config, { group: 0, index: 2 }, { group: 0, index: 0 }))).toEqual([
      "Home: CAB",
      "Work: X",
    ])
  })

  test("moves a link to the end of its group", () => {
    expect(names(moveLink(config, { group: 0, index: 0 }, { group: 0, index: 3 }))).toEqual([
      "Home: BCA",
      "Work: X",
    ])
  })

  test("moves a link into another group", () => {
    expect(names(moveLink(config, { group: 0, index: 1 }, { group: 1, index: 0 }))).toEqual([
      "Home: AC",
      "Work: BX",
    ])
  })

  test("moves a link to the end of another group", () => {
    expect(names(moveLink(config, { group: 0, index: 1 }, { group: 1, index: 1 }))).toEqual([
      "Home: AC",
      "Work: XB",
    ])
  })
})

describe("groups", () => {
  test("adds an empty group at the end", () => {
    expect(names(addGroup(config, "Media"))).toEqual(["Home: ABC", "Work: X", "Media: "])
  })

  test("renames a group and keeps its links", () => {
    expect(names(renameGroup(config, 1, "Job"))).toEqual(["Home: ABC", "Job: X"])
  })

  test("removes a group with its links", () => {
    expect(names(removeGroup(config, 0))).toEqual(["Work: X"])
  })

  test("moves a group onto another's place", () => {
    expect(names(moveGroup(config, 0, 1))).toEqual(["Work: X", "Home: ABC"])
    expect(names(moveGroup(config, 1, 0))).toEqual(["Work: X", "Home: ABC"])
  })

  test("moves a group to the end", () => {
    const three = addGroup(config, "Media")
    expect(names(moveGroup(three, 0, 3))).toEqual(["Work: X", "Media: ", "Home: ABC"])
  })
})
