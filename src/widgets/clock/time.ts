export function msToNextMinute(now: Date): number {
  return 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())
}

// undefined: the browser's locale.
const time = new Intl.DateTimeFormat(undefined, { timeStyle: "short" })
const date = new Intl.DateTimeFormat(undefined, { dateStyle: "full" })

export const formatDate = (now: Date) => date.format(now)

// The time in runs, so the period of the day (AM, PM) can be drawn
// smaller; in the locale's order, and without it where the locale has none.
export function timeParts(now: Date, format = time): { text: string; period: boolean }[] {
  const runs: { text: string; period: boolean }[] = []
  for (const part of format.formatToParts(now)) {
    const period = part.type === "dayPeriod"
    const last = runs.at(-1)
    if (last?.period === period) last.text += part.value
    else runs.push({ text: part.value, period })
  }
  return runs.map((run) => ({ ...run, text: run.text.trim() })).filter((run) => run.text)
}
