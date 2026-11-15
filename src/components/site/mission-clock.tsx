"use client"

import { useEffect, useState } from "react"

export function MissionClock() {
  const [timeStr, setTimeStr] = useState<string>("--:--:--")

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toISOString().slice(11, 19))
    const init = window.setTimeout(tick, 0)
    const interval = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(init)
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="hidden items-center gap-1.5 font-mono text-[11px] text-[var(--tt-light-ink-muted)] sm:flex">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--tt-accent)]" aria-hidden="true" />
      <span className="tt-mono-data">UTC {timeStr}</span>
    </div>
  )
}
