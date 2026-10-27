// The search URL of the config with the query in place of every %s.
export function searchUrl(template: string, query: string): string {
  const encoded = encodeURIComponent(query)
  return template.replaceAll("%s", () => encoded)
}
