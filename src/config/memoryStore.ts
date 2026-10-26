import type { Store } from "./store"

// storage.local in memory, with change events like the real one; for tests.
export function memoryStore(data: Record<string, unknown> = {}): Store {
  const listeners = new Set<(key: string, value: unknown) => void>()
  return {
    async get(key) {
      return structuredClone(data[key])
    },
    async set(key, value) {
      data[key] = structuredClone(value)
      for (const listener of listeners) listener(key, structuredClone(value))
    },
    onChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
