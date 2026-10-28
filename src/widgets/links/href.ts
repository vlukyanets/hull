// A scheme, such as https: or ssh:, but not a host and its port, such as
// localhost:8000.
const SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d)/i

// The link of a tile. The URL is stored as typed; one with no scheme would
// be a page inside hull, so it gets https:// in front.
export function tileHref(url: string): string {
  return SCHEME.test(url) ? url : `https://${url}`
}
