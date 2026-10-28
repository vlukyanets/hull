import { useId } from "preact/hooks"

interface Props {
  label: string
  name: string
  // The keyboard a touch screen shows for it.
  inputMode?: "text" | "url"
  value?: string
  // The reason the value is refused, shown under the field.
  problem?: string
}

// A labelled field of a dialog, with its error under it.
export function Field({ label, name, inputMode, value, problem }: Props) {
  const id = useId()
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <input
        id={id}
        name={name}
        inputMode={inputMode}
        defaultValue={value}
        autocomplete="off"
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? `${id}-error` : undefined}
      />
      {problem && (
        <FieldError id={`${id}-error`}>
          {label}: {problem}
        </FieldError>
      )}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: preact.ComponentChildren }) {
  return (
    <p class="field-error" id={id} role="alert">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
      </svg>
      {children}
    </p>
  )
}
