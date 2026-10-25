import { cn } from "@/lib/utils"

export function IllustrativeBadge({ className, label = "Illustrative" }: { className?: string; label?: string }) {
  return (
    <span
      title="Sample value for interface development. Not real scientific evidence."
      className={cn(
        "inline-flex items-center rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-warning",
        className,
      )}
    >
      {label}
    </span>
  )
}
