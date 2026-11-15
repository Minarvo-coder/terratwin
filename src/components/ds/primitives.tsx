"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, AlertCircle, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   DsButton
   ========================================================================== */
export interface DsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  showArrow?: boolean;
}

export function DsButton({
  variant = "primary",
  size = "md",
  href,
  leadingIcon,
  trailingIcon,
  showArrow,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: DsButtonProps) {
  const sizeStyles: Record<NonNullable<DsButtonProps["size"]>, string> = {
    sm: "h-9 px-3.5 text-xs gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-12 px-6 text-sm gap-2.5",
  };

  const variantStyles: Record<NonNullable<DsButtonProps["variant"]>, string> = {
    primary:
      "rounded-[var(--tt-radius-control)] bg-[var(--tt-accent)] text-[var(--tt-accent-fg)] font-medium hover:bg-[var(--tt-accent-hover)] active:scale-[0.99] shadow-[var(--tt-shadow-soft)] focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)] focus-visible:ring-offset-2",
    secondary:
      "rounded-[var(--tt-radius-control)] bg-transparent text-[var(--tt-ink)] font-medium hover:text-[var(--tt-accent)] px-1 focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]",
    tertiary:
      "rounded-[var(--tt-radius-pill)] border border-[var(--tt-line-strong)] bg-[var(--tt-surface)]/80 text-[var(--tt-ink)] font-mono text-[11px] uppercase tracking-[0.12em] hover:border-[var(--tt-ink-muted)] hover:bg-[var(--tt-surface)] focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]",
    ghost:
      "rounded-[var(--tt-radius-control)] bg-transparent text-[var(--tt-ink-secondary)] hover:bg-[var(--tt-line)] hover:text-[var(--tt-ink)]",
  };

  const defaultTrailing =
    trailingIcon ??
    (showArrow !== false && variant === "primary" ? (
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
    ) : showArrow !== false && variant === "secondary" ? (
      <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    ) : null);

  const classes = cn(
    "group inline-flex items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,transform] duration-[var(--tt-duration)] ease-[var(--tt-ease)] cursor-pointer select-none disabled:pointer-events-none disabled:opacity-45",
    sizeStyles[size],
    variantStyles[variant],
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {leadingIcon}
        <span>{children}</span>
        {defaultTrailing}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {leadingIcon}
      <span>{children}</span>
      {defaultTrailing}
    </button>
  );
}

/* ==========================================================================
   DsSegmentedControl
   ========================================================================== */
export interface DsSegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface DsSegmentedControlProps<T extends string> {
  options: DsSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  tone?: "light" | "dark";
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
}

export function DsSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  tone = "light",
  size = "md",
  ariaLabel,
  className,
}: DsSegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-[var(--tt-radius-pill)] border p-1",
        tone === "dark"
          ? "border-[var(--tt-dark-border)] bg-[var(--tt-dark-panel)]"
          : "border-[var(--tt-light-border)] bg-[var(--tt-light-band)]",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[var(--tt-radius-pill)] font-medium transition-all duration-[var(--tt-duration)] ease-[var(--tt-ease)] cursor-pointer whitespace-nowrap",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-xs",
              active
                ? tone === "dark"
                  ? "bg-[var(--tt-dark-elevated)] text-[var(--tt-dark-ink)] shadow-sm"
                  : "bg-[var(--tt-light-ink)] text-[var(--tt-light-surface)] shadow-sm"
                : tone === "dark"
                  ? "text-[var(--tt-dark-ink-secondary)] hover:text-[var(--tt-dark-ink)]"
                  : "text-[var(--tt-light-ink-secondary)] hover:text-[var(--tt-light-ink)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   DsEyebrow
   ========================================================================== */
export function DsEyebrow({
  label,
  dot = true,
  className,
}: {
  label: string;
  dot?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-[var(--tt-ink-muted)]", className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-[var(--tt-accent)]" aria-hidden="true" />}
      <span className="tt-mono-label">{label}</span>
    </div>
  );
}

/* ==========================================================================
   DsSectionHeader
   ========================================================================== */
export interface DsSectionHeaderProps {
  index: string;
  marker: string;
  rightCaption?: React.ReactNode;
  line1: string;
  line2: string;
  tone?: "light" | "dark";
  rightSlot?: React.ReactNode;
  className?: string;
}

export function DsSectionHeader({
  index,
  marker,
  rightCaption,
  line1,
  line2,
  tone = "light",
  rightSlot,
  className,
}: DsSectionHeaderProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--tt-line)] pb-4">
        <span className="tt-mono-label text-[var(--tt-ink-muted)]">
          {index} / {marker}
        </span>
        {rightCaption && (
          <span className="text-xs text-[var(--tt-ink-muted)]">{rightCaption}</span>
        )}
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h2 className="tt-display-l max-w-2xl">
          <span className="block text-[var(--tt-ink)]">{line1}</span>
          <span
            className={cn(
              "block",
              tone === "dark" ? "text-[var(--tt-dark-periwinkle)]" : "text-[var(--tt-ink-muted)]",
            )}
          >
            {line2}
          </span>
        </h2>
        {rightSlot && <div className="max-w-sm text-sm leading-relaxed text-[var(--tt-ink-secondary)]">{rightSlot}</div>}
      </div>
    </div>
  );
}

/* ==========================================================================
   DsHonestyBadge
   ========================================================================== */
export type DsMatchTone = "high" | "moderate" | "low" | "neutral";

export function DsHonestyBadge({
  tone = "neutral",
  label,
  className,
}: {
  tone?: DsMatchTone;
  label: string;
  className?: string;
}) {
  const styles: Record<DsMatchTone, { pill: string; dot: string }> = {
    high: {
      pill: "border-[var(--tt-match-high)]/30 bg-[var(--tt-match-high-bg)] text-[var(--tt-match-high)]",
      dot: "bg-[var(--tt-match-high)]",
    },
    moderate: {
      pill: "border-[var(--tt-match-moderate)]/30 bg-[var(--tt-match-moderate-bg)] text-[var(--tt-match-moderate)]",
      dot: "bg-[var(--tt-match-moderate)]",
    },
    low: {
      pill: "border-[var(--tt-match-low)]/30 bg-[var(--tt-match-low-bg)] text-[var(--tt-match-low)]",
      dot: "bg-[var(--tt-match-low)]",
    },
    neutral: {
      pill: "border-[var(--tt-line-strong)] bg-[var(--tt-surface-muted)] text-[var(--tt-ink-secondary)]",
      dot: "bg-[var(--tt-ink-muted)]",
    },
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--tt-radius-pill)] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]",
        styles[tone].pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles[tone].dot)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/* ==========================================================================
   DsStatStrip
   ========================================================================== */
export interface DsStatItem {
  value: string;
  labelTop: string;
  labelBottom: string;
}

export function DsStatStrip({
  lead,
  items,
  tailTitle,
  tailValue,
  className,
}: {
  lead?: React.ReactNode;
  items: DsStatItem[];
  tailTitle?: string;
  tailValue?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-6 border-t border-[var(--tt-line)] pt-7 md:grid-cols-5 md:items-center",
        className,
      )}
    >
      {lead && <div className="col-span-2 text-xs text-[var(--tt-ink-muted)] md:col-span-1">{lead}</div>}
      {items.map((item) => (
        <div key={`${item.value}-${item.labelTop}`} className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-semibold tracking-tight text-[var(--tt-ink)] md:text-3xl">
            {item.value}
          </span>
          <span className="text-xs leading-tight text-[var(--tt-ink-muted)]">
            <span className="block">{item.labelTop}</span>
            <span className="block">{item.labelBottom}</span>
          </span>
        </div>
      ))}
      {(tailTitle || tailValue) && (
        <div className="col-span-2 md:col-span-1 md:text-right">
          {tailTitle && <span className="tt-mono-label block text-[var(--tt-ink-muted)]">{tailTitle}</span>}
          {tailValue && <span className="mt-1 block text-xs font-medium text-[var(--tt-ink)]">{tailValue}</span>}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   DsInput & DsSelect & DsSlider
   ========================================================================== */
export interface DsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function DsInput({ label, hint, error, id, className, ...props }: DsInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[var(--tt-ink-secondary)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-[var(--tt-radius-control)] border border-[var(--tt-line-strong)] bg-[var(--tt-surface)] px-3.5 text-sm text-[var(--tt-ink)] placeholder:text-[var(--tt-ink-muted)] focus:border-[var(--tt-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--tt-accent-soft)] disabled:opacity-50",
          error && "border-[var(--tt-error)]",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[var(--tt-error)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--tt-ink-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export interface DsSelectOption {
  value: string;
  label: string;
}

export interface DsSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: DsSelectOption[];
}

export function DsSelect({ label, options, id, className, ...props }: DsSelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-[var(--tt-ink-secondary)]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "h-10 w-full rounded-[var(--tt-radius-control)] border border-[var(--tt-line-strong)] bg-[var(--tt-surface)] px-3 text-sm text-[var(--tt-ink)] focus:border-[var(--tt-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--tt-accent-soft)] disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DsSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  suffix = "%",
  className,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--tt-ink-secondary)]">{label}</span>
        <span className="tt-mono-data font-medium text-[var(--tt-ink)]">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--tt-line-strong)] accent-[var(--tt-accent)]"
      />
    </div>
  );
}

/* ==========================================================================
   DsSkeleton, DsEmptyState, DsErrorState
   ========================================================================== */
export function DsSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--tt-radius-control)] bg-[var(--tt-line)]", className)}
    />
  );
}

export function DsEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--tt-radius-card)] border border-dashed border-[var(--tt-line-strong)] bg-[var(--tt-surface)]/60 px-6 py-10 text-center",
        className,
      )}
    >
      {icon && <div className="mb-3 text-[var(--tt-ink-muted)]">{icon}</div>}
      <h3 className="text-sm font-semibold text-[var(--tt-ink)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--tt-ink-secondary)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DsErrorState({
  title = "Unable to load telemetry",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start justify-between gap-4 rounded-[var(--tt-radius-card)] border border-[var(--tt-error)]/30 bg-[var(--tt-error)]/10 p-5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tt-error)]" />
        <div>
          <h3 className="text-sm font-semibold text-[var(--tt-ink)]">{title}</h3>
          <p className="mt-0.5 text-xs text-[var(--tt-ink-secondary)]">{description}</p>
        </div>
      </div>
      {onRetry && (
        <DsButton variant="tertiary" size="sm" onClick={onRetry} leadingIcon={<RotateCcw className="h-3.5 w-3.5" />}>
          Retry
        </DsButton>
      )}
    </div>
  );
}

/* ==========================================================================
   DsModal & DsToast
   ========================================================================== */
export function DsModal({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-[var(--tt-radius-card)] border border-[var(--tt-line-strong)] bg-[var(--tt-surface)] p-6 text-[var(--tt-ink)] shadow-[var(--tt-shadow-float)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--tt-line)] pb-4">
          <div>
            {eyebrow && <span className="tt-mono-label block text-[var(--tt-ink-muted)]">{eyebrow}</span>}
            <h3 className="mt-1 text-lg font-semibold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[var(--tt-ink-muted)] hover:bg-[var(--tt-line)] hover:text-[var(--tt-ink)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function DsToast({
  title,
  detail,
  tone = "info",
}: {
  title: string;
  detail?: string;
  tone?: "info" | "success" | "warning" | "error";
}) {
  const toneDot: Record<NonNullable<typeof tone>, string> = {
    info: "bg-[var(--tt-info)]",
    success: "bg-[var(--tt-success)]",
    warning: "bg-[var(--tt-warning)]",
    error: "bg-[var(--tt-error)]",
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-[var(--tt-radius-control)] border border-[var(--tt-line-strong)] bg-[var(--tt-surface)] px-4 py-3 shadow-[var(--tt-shadow-soft)]">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", toneDot[tone])} aria-hidden="true" />
      <div className="text-xs">
        <span className="font-semibold text-[var(--tt-ink)]">{title}</span>
        {detail && <span className="ml-2 text-[var(--tt-ink-secondary)]">{detail}</span>}
      </div>
    </div>
  );
}
