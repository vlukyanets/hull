import { useState } from "preact/hooks"
import { nameProblem, type Group } from "../../config"
import { useModal } from "./useModal"

interface Props {
  // The group to change; none to add one.
  group?: Group
  // Each gives the reason it failed, or undefined.
  onSave(name: string): Promise<string | undefined>
  onRemove?(): Promise<string | undefined>
  onClose(): void
}

export function GroupDialog({ group, onSave, onRemove, onClose }: Props) {
  const dialog = useModal()
  const [problem, setProblem] = useState<string>()
  // A group with links is removed only on a second click, after the
  // question.
  const [asking, setAsking] = useState(false)

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const name = new FormData(event.currentTarget as HTMLFormElement).get("name") as string
    const found = nameProblem(name)
    if (found) return setProblem(`Name: ${found}`)
    const failed = await onSave(name)
    if (failed) return setProblem(`Not saved: ${failed}`)
    dialog.current?.close()
  }

  async function remove() {
    if (group && group.links.length > 0 && !asking) return setAsking(true)
    const failed = await onRemove?.()
    if (failed) return setProblem(`Not saved: ${failed}`)
    dialog.current?.close()
  }

  const count = group?.links.length ?? 0
  return (
    <dialog ref={dialog} class="dialog" onClose={onClose}>
      <form onSubmit={save} noValidate>
        <h2>{group ? "Change the group" : "Add a group"}</h2>
        <label>
          Name
          <input name="name" defaultValue={group?.name} autocomplete="off" />
        </label>
        {problem && <p class="field-error">{problem}</p>}
        {asking && (
          <p class="field-error" role="alert">
            Remove {group?.name} and its {count} {count === 1 ? "link" : "links"}?
          </p>
        )}
        <div class="dialog-actions">
          <button type="submit">Save</button>
          {onRemove && (
            <button type="button" onClick={remove}>
              {asking ? "Yes, remove" : "Remove"}
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
