"use client"

import { useEffect, useState } from "react"

export function MissionClock() {
  const [timeStr, setTimeStr] = useState<string>("")

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const utc = now.toISOString().substring(11, 19)
      setTimeStr(`UTC ${utc}`)
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden 2xl:flex shrink-0 items-center gap-2.5 font-mono text-[11px] text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-md">
      <span className="flex items-center gap-1.5 text-sky-400 font-medium">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400"></span>
        </span>
        LIVE TELEMETRY
      </span>
      <span className="text-slate-700">|</span>
      <span className="tabular-nums text-slate-300">
        {timeStr || "UTC --:--:--"}
      </span>
      <span className="text-slate-700">|</span>
      <span className="text-emerald-400 font-medium">
        SYSTEM NOMINAL
      </span>
    </div>
  )
}
