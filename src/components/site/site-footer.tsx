import Link from "next/link"
import { SAMPLE_DATASET_META } from "@/lib/terratwin/sample-dataset"

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          TerraTwin · Dataset: {SAMPLE_DATASET_META.name} (v{SAMPLE_DATASET_META.version})
        </p>
        <p>
          Illustrative values only — not scientific evidence.{" "}
          <Link href="/methodology" className="text-primary underline-offset-4 hover:underline">
            Read the methodology
          </Link>
        </p>
      </div>
    </footer>
  )
}
