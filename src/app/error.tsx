"use client"

import { useEffect } from "react"
import { RotateCcw } from "lucide-react"
import { DsButton, DsEyebrow } from "@/components/ds/primitives"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("TerraTwin route error:", error)
  }, [error])

  return (
    <main className="tt-surface-light flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md space-y-5">
        <DsEyebrow label="TELEMETRY INTERRUPTION" />
        <h1 className="tt-display-m text-[var(--tt-light-ink)]">Something went wrong</h1>
        <p className="text-sm leading-relaxed text-[var(--tt-light-ink-secondary)]">
          {error.message || "An unexpected error occurred while rendering this view."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <DsButton variant="primary" onClick={reset} trailingIcon={<RotateCcw className="size-4" />}>
            Try again
          </DsButton>
          <DsButton variant="secondary" href="/">
            Back to Overview
          </DsButton>
        </div>
      </div>
    </main>
  )
}
