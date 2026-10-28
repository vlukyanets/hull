import { vi } from "vitest"

// For the component tests: waits until check passes, however long the page
// takes to draw. The timeout only stops a hang; it stays under vitest's
// 5 s for a test, so a failure says what never came.
export function until<T>(check: () => T): Promise<T> {
  return vi.waitFor(check, { timeout: 3000 })
}
