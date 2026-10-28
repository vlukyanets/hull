import { useEffect, useState } from "preact/hooks"
import { formatDate, msToNextMinute, timeParts } from "./time"

export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setTimeout(() => setNow(new Date()), msToNextMinute(now))
    return () => clearTimeout(timer)
  }, [now])

  return (
    <section class="clock">
      <time class="clock-time" dateTime={now.toISOString()}>
        {timeParts(now).map((run, i) =>
          run.period ? (
            <span key={i} class="clock-period">
              {run.text}
            </span>
          ) : (
            run.text
          ),
        )}
      </time>
      <div class="clock-date">{formatDate(now)}</div>
    </section>
  )
}
