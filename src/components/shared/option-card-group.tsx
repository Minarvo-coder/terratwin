"use client"

import { cn } from "@/lib/utils"

export interface OptionCard<T extends string> {
  value: T
  label: string
  description?: string
  meta?: string
}

interface OptionCardGroupProps<T extends string> {
  name: string
  legend: string
  options: OptionCard<T>[]
  value: T
  onChange: (value: T) => void
  columns?: 1 | 2
  hideLegend?: boolean
}

export function OptionCardGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  columns = 1,
  hideLegend = false,
}: OptionCardGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cn("mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground", hideLegend && "sr-only")}>
        {legend}
      </legend>
      <div className={cn("grid gap-2", columns === 2 && "grid-cols-2")}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-md border border-border bg-background/40 px-3 py-2.5 transition-colors hover:bg-muted/60",
              "has-[:checked]:border-primary/60 has-[:checked]:bg-primary/10",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="flex items-center justify-between gap-2 text-sm font-medium">
              {option.label}
              {option.meta && <span className="font-mono text-[11px] text-muted-foreground">{option.meta}</span>}
            </span>
            {option.description && (
              <span className="text-xs leading-relaxed text-muted-foreground">{option.description}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
