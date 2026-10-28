import { useState } from "preact/hooks"
import { nameProblem, type Link } from "../../config"
import { useModal } from "./useModal"

interface Props {
  // The link to change; none to add one.
  link?: Link
  // Each gives the reason it failed, or undefined.
  onSave(link: Link): Promise<string | undefined>
  onRemove?(): Promise<string | undefined>
  onClose(): void
}

interface Problems {
  name?: string
  save?: string
}

export function LinkDialog({ link, onSave, onRemove, onClose }: Props) {
  const dialog = useModal()
  const [problems, setProblems] = useState<Problems>({})

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const form = new FormData(event.currentTarget as HTMLFormElement)
    const changed = { name: form.get("name") as string, url: (form.get("url") as string).trim() }
    const found = nameProblem(changed.name)
    if (found) return setProblems({ name: found })
    const problem = await onSave(changed)
    if (problem) return setProblems({ save: problem })
    dialog.current?.close()
  }

  async function remove() {
    const problem = await onRemove?.()
    if (problem) return setProblems({ save: problem })
    dialog.current?.close()
  }

  return (
    <dialog ref={dialog} class="dialog" onClose={onClose}>
      <form onSubmit={save} noValidate>
        <h2>{link ? "Change the link" : "Add a link"}</h2>
        <label>
          Name
          <input name="name" defaultValue={link?.name} autocomplete="off" />
        </label>
        {problems.name && <p class="field-error">Name: {problems.name}</p>}
        <label>
          URL
          <input name="url" type="url" defaultValue={link?.url} autocomplete="off" />
        </label>
        {problems.save && (
          <p class="field-error" role="alert">
            Not saved: {problems.save}
          </p>
        )}
        <div class="dialog-actions">
          <button type="submit">Save</button>
          {onRemove && (
            <button type="button" onClick={remove}>
              Remove
            </button>
          )}
          <button type="button" onClick={() => dialog.current?.close()}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  )
}
