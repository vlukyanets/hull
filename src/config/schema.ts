// The config as the pages use it, after parse.ts has checked it.

export const WIDGETS = ["clock"] as const

export type Widget = (typeof WIDGETS)[number]

export interface Config {
  version: 1
  layout: {
    widgets: Widget[]
  }
}
