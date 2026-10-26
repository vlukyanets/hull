import { useEffect, useState } from "preact/hooks"
import { formatDate, formatTime, msToNextMinute } from "./time"

export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setTimeout(() => setNow(new Date()), msToNextMinute(now))
    return () => clearTimeout(timer)
  }, [now])

  return (
    <section class="clock">
      <time class="clock-time" dateTime={now.toISOString()}>
        {formatTime(now)}
      </time>
      <div class="clock-date">{formatDate(now)}</div>
    </section>
  )
}
