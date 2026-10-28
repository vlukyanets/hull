import { useState } from "preact/hooks"
import type { WidgetProps } from "../props"

// Searches in this tab with the browser's default engine; Firefox and
// Chromium both have search.query. Off in edit mode.
export function Search({ editing }: WidgetProps) {
  const [error, setError] = useState<string>()

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const query = (new FormData(form).get("q") as string).trim()
    if (query === "") return
    setError(undefined)
    try {
      await browser.search.query({ text: query, disposition: "CURRENT_TAB" })
    } catch (e) {
      setError(`Not searched: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <section class="search">
      <form role="search" onSubmit={submit}>
        <svg class="search-icon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          type="search"
          name="q"
          aria-label="Search"
          placeholder="Search"
          autocomplete="off"
          autofocus
          disabled={editing}
        />
      </form>
      {error && (
        <p class="search-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
