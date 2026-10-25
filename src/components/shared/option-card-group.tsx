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
      <legend
        className={cn(
          "mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between",
          hideLegend && "sr-only",
        )}
      >
        <span>{legend}</span>
        <span className="text-[10px] text-cyan-400/70 font-normal">SELECT PARAM</span>
      </legend>
      <div className={cn("grid gap-2", columns === 2 && "grid-cols-2")}>
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <label
              key={option.value}
              className={cn(
                "group relative flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2.5 transition-all duration-150 backdrop-blur-sm",
                isSelected
                  ? "border-cyan-400/70 bg-cyan-950/40 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40 hover:text-white",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full transition-all",
                      isSelected ? "bg-cyan-400 shadow-[0_0_8px_#38bdf8]" : "bg-slate-700",
                    )}
                  />
                  <span>{option.label}</span>
                </span>
                {option.meta && (
                  <span className="font-mono text-[10px] text-slate-500">{option.meta}</span>
                )}
              </span>
              {option.description && (
                <span className="text-[11px] leading-relaxed text-slate-400 pl-3.5">
                  {option.description}
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
