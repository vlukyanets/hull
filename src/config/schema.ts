// The config as the pages use it, after parse.ts has checked it.

export const WIDGETS = ["clock", "search", "links"] as const

export type Widget = (typeof WIDGETS)[number]

export interface Link {
  name: string
  url: string
}

export interface Group {
  name: string
  links: Link[]
}

// At most one of the two; neither means the browser's default engine.
export interface Search {
  engine?: string
  // With %s where the query goes.
  url?: string
}

export interface Config {
  version: 1
  layout: {
    widgets: Widget[]
  }
  search: Search
  groups: Group[]
}
