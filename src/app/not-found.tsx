import { DsButton, DsEyebrow } from "@/components/ds/primitives"

export default function NotFoundPage() {
  return (
    <main className="tt-surface-light flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md space-y-5">
        <DsEyebrow label="404 / COORDINATE NOT FOUND" />
        <h1 className="tt-display-l text-[var(--tt-light-ink)]">
          <span className="block">Uncharted terrain.</span>
          <span className="block text-[var(--tt-light-ink-muted)]">Route not found.</span>
        </h1>
        <p className="text-sm leading-relaxed text-[var(--tt-light-ink-secondary)]">
          The page or planetary workspace you requested does not exist or has moved. Return to the Overview or launch
          the Explorer.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <DsButton variant="primary" href="/explore">
            Open Explorer
          </DsButton>
          <DsButton variant="secondary" href="/">
            Back to Overview
          </DsButton>
        </div>
      </div>
    </main>
  )
}
