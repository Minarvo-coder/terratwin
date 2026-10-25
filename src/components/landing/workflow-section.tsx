import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"

const STEPS = [
  { title: "Select a target", body: "Choose a lunar or Martian region with a reference environmental profile." },
  { title: "Set the mission purpose", body: "Rover testing and geological research weight features differently." },
  { title: "Explore ranked analogs", body: "See Earth candidates on a map and in a ranked list with data coverage." },
  { title: "Compare features", body: "Inspect target vs. candidate values and per-feature similarity." },
]

export function WorkflowSection() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="How it works" title="From target environment to ranked field sites" />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-border p-5">
              <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-4 rounded-lg border border-warning/30 bg-warning/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-warning">Current status:</span> this release runs on a small illustrative
            sample dataset. Rankings demonstrate the interface and scoring pipeline only.
          </p>
          <Link href="/explore" className={buttonVariants({ variant: "secondary" })}>
            Try the explorer
          </Link>
        </div>
      </div>
    </section>
  )
}
