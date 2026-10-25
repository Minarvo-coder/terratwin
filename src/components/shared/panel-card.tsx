import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PanelCardProps {
  title: string
  description?: string
  actions?: ReactNode
  isUpdating?: boolean
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function PanelCard({ title, description, actions, isUpdating, children, className, bodyClassName }: PanelCardProps) {
  return (
    <section
      aria-label={title}
      aria-busy={isUpdating || undefined}
      className={cn("flex min-w-0 flex-col rounded-lg border border-border bg-card", className)}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-sm font-medium">{title}</h2>
          {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isUpdating && (
            <span role="status" className="font-mono text-[11px] text-muted-foreground">
              Updating…
            </span>
          )}
          {actions}
        </div>
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  )
}
