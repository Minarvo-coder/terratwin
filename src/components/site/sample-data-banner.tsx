import { FlaskConical } from "lucide-react"
import { SAMPLE_DATASET_META } from "@/lib/terratwin/sample-dataset"

export function SampleDataBanner() {
  return (
    <div role="note" className="border-b border-warning/30 bg-warning/10 text-warning">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs sm:px-6">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Sample dataset.</span> {SAMPLE_DATASET_META.notice}
        </p>
      </div>
    </div>
  )
}
