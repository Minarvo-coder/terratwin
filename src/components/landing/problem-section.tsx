import { Layers, Route, Rocket } from "lucide-react"
import { SectionHeading } from "@/components/shared/section-heading"

const PROBLEMS = [
  {
    icon: Rocket,
    title: "Off-Earth testing is scarce",
    body: "Every hour of rover operation or field geology on the Moon or Mars is extraordinarily expensive. Most validation must happen on Earth first.",
  },
  {
    icon: Route,
    title: "Analog choice is often ad hoc",
    body: "Field sites are frequently selected by habit, logistics or reputation rather than a transparent, comparable assessment against the target environment.",
  },
  {
    icon: Layers,
    title: "Evidence is fragmented",
    body: "Thermal, terrain, compositional and climatic data live in separate archives with different resolutions, making side-by-side comparison slow.",
  },
]

export function ProblemSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="The problem"
          title="Choosing an Earth analog should be explicit and reproducible"
          description="No site on Earth is a perfect twin of another world. The useful question is which site matches the features that matter for a specific mission objective — and how confident we can be in that match."
        />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-lg border border-border bg-card p-5">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
