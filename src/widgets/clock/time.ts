export function msToNextMinute(now: Date): number {
  return 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())
}

// undefined: the browser's locale.
const time = new Intl.DateTimeFormat(undefined, { timeStyle: "short" })
const date = new Intl.DateTimeFormat(undefined, { dateStyle: "full" })

export const formatTime = (now: Date) => time.format(now)
export const formatDate = (now: Date) => date.format(now)
