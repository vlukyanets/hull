// The letter on a tile. Spread by code points, so a character outside the
// basic plane stays whole.
export function firstLetter(name: string): string {
  return [...name.trim()][0].toUpperCase()
}
