interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  as?: "h1" | "h2"
}

export function SectionHeading({ eyebrow, title, description, as: Heading = "h2" }: SectionHeadingProps) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      {eyebrow && (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--tt-accent)]" aria-hidden="true" />
          <p className="tt-mono-label text-[var(--tt-ink-muted)]">{eyebrow}</p>
        </div>
      )}
      <Heading
        className={
          Heading === "h1"
            ? "tt-display-l text-balance text-[var(--tt-ink)]"
            : "tt-display-m text-balance text-[var(--tt-ink)]"
        }
      >
        {title}
      </Heading>
      {description && (
        <p className="text-pretty text-sm leading-relaxed text-[var(--tt-ink-secondary)] sm:text-base">
          {description}
        </p>
      )}
    </div>
  )
}
