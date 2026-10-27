import { useEffect, useState } from "preact/hooks"
import { browserStore, configToml, saveConfig, type Store } from "../config"
import { useConfig } from "../config/useConfig"

type Status = { saved: true } | { saved: false; error: string } | undefined

// store: storage.local, or a store in memory in tests.
export function Options({ store = browserStore }: { store?: Store }) {
  const loaded = useConfig(store)
  const [text, setText] = useState<string>()
  const [status, setStatus] = useState<Status>()

  // Fill the editor once; a save from another tab does not replace what is
  // being typed here.
  useEffect(() => {
    if (loaded && text === undefined) setText(configToml(loaded.config))
  }, [loaded, text])

  if (!loaded || text === undefined) return null

  async function save(event: SubmitEvent) {
    event.preventDefault()
    // Read the field itself: text is from the last render, which can be
    // behind when the form is sent right after an input.
    const form = event.currentTarget as HTMLFormElement
    const toml = new FormData(form).get("config") as string
    const result = await saveConfig(store, toml)
    setStatus(result.ok ? { saved: true } : { saved: false, error: result.error })
  }

  return (
    <main class="options">
      <header>
        <h1>hull</h1>
        <a href="newtab.html">Back to the new tab</a>
      </header>
      {loaded.error && (
        <p class="banner" role="alert">
          {loaded.error}
        </p>
      )}
      <form onSubmit={save}>
        <label for="config">
          The config, in TOML. It is checked before it is saved; nothing is
          saved while it has an error.
        </label>
        <textarea
          id="config"
          name="config"
          spellcheck={false}
          value={text}
          onInput={(event) => {
            setText(event.currentTarget.value)
            setStatus(undefined)
          }}
        />
        <div class="actions">
          <button type="submit">Save</button>
          <span class="status" role="status">
            {status?.saved && "Saved."}
            {status && !status.saved && `Not saved: ${status.error}`}
          </span>
        </div>
      </form>
    </main>
  )
}
