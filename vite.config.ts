import { defineConfig } from "vite"

export default defineConfig({
  oxc: { jsx: { importSource: "preact" } },
  build: {
    rolldownOptions: { input: { newtab: "newtab.html" } },
  },
})
