interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  as?: "h1" | "h2"
}

export function SectionHeading({ eyebrow, title, description, as: Heading = "h2" }: SectionHeadingProps) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      {eyebrow && <p className="font-mono text-xs uppercase tracking-widest text-primary">{eyebrow}</p>}
      <Heading className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</Heading>
      {description && <p className="text-pretty leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}
