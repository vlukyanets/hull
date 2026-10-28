import { useEffect, useRef, useState } from "preact/hooks"
import { nameProblem, type Group } from "../../config"
import { Field, FieldError } from "./Field"
import { useModal } from "./useModal"

interface Props {
  // The group to change; none to add one.
  group?: Group
  // Each gives the reason it failed, or undefined.
  onSave(name: string): Promise<string | undefined>
  onRemove?(): Promise<string | undefined>
  onClose(): void
}

interface Problems {
  name?: string
  save?: string
}

export function GroupDialog({ group, onSave, onRemove, onClose }: Props) {
  const dialog = useModal()
  const [problems, setProblems] = useState<Problems>({})
  // A group with links is removed only after a question, which takes the
  // place of the form; the form stays, hidden, with what was typed.
  const [asking, setAsking] = useState(false)
  const cancel = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (asking) cancel.current?.focus()
  }, [asking])

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const name = new FormData(event.currentTarget as HTMLFormElement).get("name") as string
    const found = nameProblem(name)
    if (found) return setProblems({ name: found })
    const failed = await onSave(name)
    if (failed) return setProblems({ save: failed })
    dialog.current?.close()
  }

  async function remove() {
    if (group && group.links.length > 0 && !asking) return setAsking(true)
    const failed = await onRemove?.()
    if (failed) {
      setAsking(false)
      return setProblems({ save: failed })
    }
    dialog.current?.close()
  }

  // Escape during the question goes back to the group, not out.
  function onCancel(event: Event) {
    if (!asking) return
    event.preventDefault()
    setAsking(false)
  }

  const count = group?.links.length ?? 0
  return (
    <dialog ref={dialog} class="dialog" onClose={onClose} onCancel={onCancel}>
      <form onSubmit={save} noValidate hidden={asking}>
        <h2>{group ? "Edit group" : "Add group"}</h2>
        <Field label="Name" name="name" value={group?.name} problem={problems.name} />
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
      {asking && (
        <div class="dialog-question" role="alertdialog" aria-labelledby="remove-question">
          <h2 id="remove-question">
            Remove {group?.name} and its {count} {count === 1 ? "link" : "links"}?
          </h2>
          <div class="dialog-actions">
            <button type="button" class="button" ref={cancel} onClick={() => setAsking(false)}>
              Cancel
            </button>
            <button type="button" class="button button-danger-strong" onClick={remove}>
              Yes, remove
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
