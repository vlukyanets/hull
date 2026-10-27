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

export interface Config {
  version: 1
  layout: {
    widgets: Widget[]
  }
  groups: Group[]
}
