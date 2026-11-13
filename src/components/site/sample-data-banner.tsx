"use client"

import { useState } from "react"
import { FlaskConical, X } from "lucide-react"
import { SAMPLE_DATASET_META } from "@/lib/terratwin/sample-dataset"

export function SampleDataBanner() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div role="note" className="border-b border-warning/30 bg-warning/10 text-warning transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-1.5 text-xs sm:px-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-semibold">Sample dataset notice:</span> {SAMPLE_DATASET_META.notice}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="rounded p-1 hover:bg-warning/20 text-warning transition cursor-pointer"
          title="Dismiss notice"
          aria-label="Dismiss notice"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
