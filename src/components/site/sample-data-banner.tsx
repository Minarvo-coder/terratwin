"use client"

import { useState } from "react"
import { FlaskConical, X } from "lucide-react"
import { SAMPLE_DATASET_META } from "@/lib/terratwin/sample-dataset"

export function SampleDataBanner() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div
      role="note"
      className="border-b border-[var(--tt-light-border)] bg-[var(--tt-light-band)] text-[var(--tt-light-ink-secondary)]"
    >
      <div className="tt-container flex items-center justify-between gap-3 py-1.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="size-3.5 shrink-0 text-[var(--tt-accent)]" aria-hidden="true" />
          <p className="truncate sm:whitespace-normal">
            <span className="font-semibold text-[var(--tt-light-ink)]">Sample dataset notice:</span>{" "}
            {SAMPLE_DATASET_META.notice}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="rounded p-1 text-[var(--tt-light-ink-muted)] transition hover:bg-black/5 hover:text-[var(--tt-light-ink)] cursor-pointer"
          title="Dismiss notice"
          aria-label="Dismiss notice"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
