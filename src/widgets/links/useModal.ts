import { useEffect, useRef } from "preact/hooks"

// A <dialog> shown as a modal once it is drawn. Closing it, with Escape or
// with ref.current.close(), fires its close event.
export function useModal() {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => ref.current?.showModal(), [])
  return ref
}
