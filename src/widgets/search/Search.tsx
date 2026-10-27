import { useState } from "preact/hooks"
import type { Config } from "../../config"
import { search } from "../../platform/search"
import { searchUrl } from "./url"

export function Search({ config }: { config: Config }) {
  const [error, setError] = useState<string>()

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const query = (new FormData(form).get("q") as string).trim()
    if (query === "") return
    setError(undefined)
    const { engine, url } = config.search
    if (url) {
      location.assign(searchUrl(url, query))
      return
    }
    try {
      await search(query, engine)
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
