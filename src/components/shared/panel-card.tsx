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
      className={cn("flex min-w-0 flex-col rounded-xl border border-slate-800 bg-slate-900/60 shadow-xs", className)}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {description && <p className="text-xs leading-relaxed text-slate-400">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isUpdating && (
            <span role="status" className="font-mono text-[11px] text-sky-400">
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
