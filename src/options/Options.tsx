import { useEffect, useRef, useState } from "preact/hooks"
import { browserStore, configToml, saveConfig, type Store } from "../config"
import { useConfig } from "../config/useConfig"

// The line under the editor; its kind picks the icon and the color.
type Status = { kind: "saved" | "imported" | "error"; text: string }

const ICONS = {
  saved: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  imported: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </>
  ),
}

// store: storage.local, or a store in memory in tests.
export function Options({ store = browserStore }: { store?: Store }) {
  const loaded = useConfig(store)
  const [text, setText] = useState<string>()
  const [status, setStatus] = useState<Status>()
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
    setStatus(
      result.ok
        ? { kind: "saved", text: "Saved." }
        : { kind: "error", text: `Not saved: ${result.error}` },
    )
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
      setStatus({ kind: "imported", text: `Imported ${file.name}.` })
    } else {
      setStatus({ kind: "error", text: `Not imported: ${result.error}` })
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

  const failed = status?.kind === "error"
  // Opened from Settings in edit mode, the page leads back to editing;
  // from about:addons, to the new tab.
  const fromEditing = location.hash === "#edit"
  return (
    <main class="options">
      <header>
        <h1>hull</h1>
        <a class="back" href={fromEditing ? "newtab.html#edit" : "newtab.html"}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {fromEditing ? "Back to editing" : "Back to the new tab"}
        </a>
      </header>
      {loaded.error && (
        <p class="banner" role="alert">
          {loaded.error}
        </p>
      )}
      <form onSubmit={save}>
        <label for="config">
          Configuration <span class="label-note">(TOML)</span>
        </label>
        <textarea
          id="config"
          name="config"
          spellcheck={false}
          value={text}
          aria-describedby={failed ? "config-status" : undefined}
          onInput={(event) => {
            setText(event.currentTarget.value)
            setStatus(undefined)
          }}
        />
        <div class="actions">
          <button type="submit" class="button button-primary">
            Save
          </button>
          <button type="button" class="button" onClick={() => importField.current?.click()}>
            Import...
          </button>
          <button type="button" class="button" onClick={exportFile}>
            Export
          </button>
          <input
            ref={importField}
            type="file"
            accept=".toml"
            hidden
            onChange={importFile}
          />
          <p id="config-status" class={failed ? "status failed" : "status"} role="status">
            {status && (
              <>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
                  {ICONS[status.kind]}
                </svg>
                {status.text}
              </>
            )}
          </p>
        </div>
      </form>
    </main>
  )
}
