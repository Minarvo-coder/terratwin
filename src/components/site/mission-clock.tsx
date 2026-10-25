"use client"

import { useEffect, useState } from "react"
import { Activity, Radio } from "lucide-react"

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
    <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-400 bg-slate-900/80 border border-cyan-500/20 px-3 py-1 rounded-full backdrop-blur-sm">
      <span className="flex items-center gap-1.5 text-cyan-400 font-semibold tracking-wider">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <Radio className="size-3 text-cyan-400" />
        LIVE ORBITAL FEED
      </span>
      <span className="text-slate-600">|</span>
      <span className="tabular-nums font-mono text-slate-300">
        {timeStr || "UTC --:--:--"}
      </span>
      <span className="text-slate-600">|</span>
      <span className="text-emerald-400 flex items-center gap-1">
        <Activity className="size-3" />
        NOMINAL
      </span>
    </div>
  )
}
