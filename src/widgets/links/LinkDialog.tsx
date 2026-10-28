import { useState } from "preact/hooks"
import { nameProblem, type Link } from "../../config"
import { Field, FieldError } from "./Field"
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
        <h2>{link ? "Edit link" : "Add link"}</h2>
        <Field label="Name" name="name" value={link?.name} problem={problems.name} />
        <Field label="URL" name="url" inputMode="url" value={link?.url} />
        {problems.save && <FieldError>Not saved: {problems.save}</FieldError>}
        <div class="dialog-actions">
          {onRemove && (
            <button type="button" class="button button-danger" onClick={remove}>
              Remove
            </button>
          )}
          <button type="button" class="button" onClick={() => dialog.current?.close()}>
            Cancel
          </button>
          <button type="submit" class="button button-primary">
            Save
          </button>
        </div>
      </form>
    </dialog>
  )
}
