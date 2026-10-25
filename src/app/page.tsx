import { LandingHero } from "@/components/landing/landing-hero"
import { ProblemSection } from "@/components/landing/problem-section"
import { WorkflowSection } from "@/components/landing/workflow-section"

export default function HomePage() {
  return (
    <main>
      <LandingHero />
      <ProblemSection />
      <WorkflowSection />
    </main>
  )
}
