import type { Config, Group, Link } from "./schema"

// The changes edit mode makes to the config. Each gives a new config and
// leaves the one it was given as it was; storeConfig checks the result.

// Where a link is: the index of its group, and its index in that group.
export interface Place {
  group: number
  index: number
}

function withGroups(config: Config, change: (groups: Group[]) => void): Config {
  const groups = config.groups.map((group) => ({ ...group, links: [...group.links] }))
  change(groups)
  return { ...config, groups }
}

export function addLink(config: Config, group: number, link: Link): Config {
  return withGroups(config, (groups) => groups[group].links.push(link))
}

export function setLink(config: Config, at: Place, link: Link): Config {
  return withGroups(config, (groups) => groups[at.group].links.splice(at.index, 1, link))
}

export function removeLink(config: Config, at: Place): Config {
  return withGroups(config, (groups) => groups[at.group].links.splice(at.index, 1))
}

// The link takes the place of the one at to, or goes last when to is past
// the end of the group.
export function moveLink(config: Config, from: Place, to: Place): Config {
  return withGroups(config, (groups) => {
    const [link] = groups[from.group].links.splice(from.index, 1)
    groups[to.group].links.splice(to.index, 0, link)
  })
}

export function addGroup(config: Config, name: string): Config {
  return withGroups(config, (groups) => groups.push({ name, links: [] }))
}

export function renameGroup(config: Config, group: number, name: string): Config {
  return withGroups(config, (groups) => (groups[group].name = name))
}

export function removeGroup(config: Config, group: number): Config {
  return withGroups(config, (groups) => groups.splice(group, 1))
}

// Like moveLink: the group takes the place of the one at to.
export function moveGroup(config: Config, from: number, to: number): Config {
  return withGroups(config, (groups) => {
    const [group] = groups.splice(from, 1)
    groups.splice(to, 0, group)
  })
}
