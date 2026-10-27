import { useEffect, useRef, useState } from "preact/hooks"
import { browserStore, configToml, saveConfig, type Store } from "../config"
import { useConfig } from "../config/useConfig"

// store: storage.local, or a store in memory in tests.
export function Options({ store = browserStore }: { store?: Store }) {
  const loaded = useConfig(store)
  const [text, setText] = useState<string>()
  const [status, setStatus] = useState<string>()
  const importField = useRef<HTMLInputElement>(null)

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
    setStatus(result.ok ? "Saved." : `Not saved: ${result.error}`)
  }

  // A valid file is saved at once and replaces the text in the editor,
  // saved or not; a bad one changes nothing.
  async function importFile(event: Event) {
    const field = event.currentTarget as HTMLInputElement
    const file = field.files?.[0]
    if (!file) return
    field.value = ""
    const result = await saveConfig(store, await file.text())
    if (result.ok) {
      setText(configToml(result.config))
      setStatus(`Imported ${file.name}.`)
    } else {
      setStatus(`Not imported: ${result.error}`)
    }
  }

  // Writes the saved config, not the editor, so the file always imports.
  const exportFile = () => {
    const blob = new Blob([configToml(loaded.config)], { type: "application/toml" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "hull.toml"
    link.click()
    URL.revokeObjectURL(link.href)
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
          <button type="button" onClick={() => importField.current?.click()}>
            Import
          </button>
          <button type="button" onClick={exportFile}>
            Export
          </button>
          <input
            ref={importField}
            type="file"
            accept=".toml"
            hidden
            onChange={importFile}
          />
          <span class="status" role="status">
            {status}
          </span>
        </div>
      </form>
    </main>
  )
}
