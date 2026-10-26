// The part of storage.local the config needs; tests give a store in memory.
export interface Store {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  // Calls back with the new value of a key that changed; returns a stop.
  onChange(listener: (key: string, value: unknown) => void): () => void
}

export const browserStore: Store = {
  async get(key) {
    return (await browser.storage.local.get(key))[key]
  },
  set(key, value) {
    return browser.storage.local.set({ [key]: value })
  },
  onChange(listener) {
    const onChanged = (changes: Record<string, browser.storage.StorageChange>) => {
      for (const [key, change] of Object.entries(changes)) {
        listener(key, change.newValue)
      }
    }
    browser.storage.local.onChanged.addListener(onChanged)
    return () => browser.storage.local.onChanged.removeListener(onChanged)
  },
}
