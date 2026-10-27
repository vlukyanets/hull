// Searches in this tab. Firefox has search.search, which can use any of
// its engines; Chromium has only search.query, with the default engine, so
// there the engine is not used.
export async function search(query: string, engine?: string): Promise<void> {
  const disposition = "CURRENT_TAB"
  if (typeof browser.search.search !== "function") {
    return browser.search.query({ text: query, disposition })
  }
  if (!engine) return browser.search.search({ query, disposition })
  try {
    await browser.search.search({ query, engine, disposition })
  } catch (e) {
    // Firefox says only "<name> was not found"; say what was not found.
    const engines = await browser.search.get()
    if (!engines.some((installed) => installed.name === engine)) {
      throw new Error(`${engine} search engine was not found`)
    }
    throw e
  }
}
