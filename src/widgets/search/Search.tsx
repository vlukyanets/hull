import { useState } from "preact/hooks"

// Searches in this tab with the browser's default engine; Firefox and
// Chromium both have search.query.
export function Search() {
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
        <input
          type="search"
          name="q"
          aria-label="Search"
          placeholder="Search"
          autocomplete="off"
          autofocus
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
