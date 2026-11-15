import { createClient } from "@/utils/supabase/server"
import { connection } from "next/server"
import Link from "next/link"
import { Suspense } from "react"
import { Database, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, Terminal, Loader2 } from "lucide-react"

interface LocationRow {
  id: string
  name: string
  planetary_body: string
  location_role: string
  latitude: number | null
  longitude: number | null
  created_at: string
}

interface DiagnosticResult {
  latencyMs: number
  error: { message: string; details?: string; hint?: string; code?: string } | null
  locations: LocationRow[] | null
}

async function getDiagnostics(): Promise<DiagnosticResult> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const response = await supabase
      .from("locations")
      .select("id, name, planetary_body, location_role, latitude, longitude, created_at")
      .order("created_at", { ascending: false })

    const latencyMs = Math.max(1, Date.now() - start)
    if (response.error) {
      return { latencyMs, error: response.error, locations: null }
    }
    return { latencyMs, error: null, locations: (response.data as LocationRow[]) ?? [] }
  } catch (err: unknown) {
    const latencyMs = Math.max(1, Date.now() - start)
    const message = err instanceof Error ? err.message : "Unexpected exception occurred while executing query."
    return { latencyMs, error: { message }, locations: null }
  }
}

async function TestDbContent() {
  await connection()
  const { latencyMs, error, locations } = await getDiagnostics()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isUrlConfigured = !!supabaseUrl && !supabaseUrl.includes("your-project")

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Status Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-5">
          <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">PROJECT URL</div>
          <div className="tt-mono-data mt-1.5 truncate text-xs font-semibold text-[var(--tt-light-ink)]">
            {isUrlConfigured ? supabaseUrl : "NOT CONFIGURED"}
          </div>
          <div className="mt-1 text-[11px] text-[var(--tt-light-ink-secondary)]">
            {isUrlConfigured ? "Configured in .env.local" : "Using placeholder"}
          </div>
        </div>

        <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-5">
          <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">QUERY LATENCY</div>
          <div className="tt-mono-data mt-1.5 text-xs font-semibold text-[var(--tt-light-ink)]">{latencyMs} ms</div>
          <div className="mt-1 text-[11px] text-[var(--tt-light-ink-secondary)]">Roundtrip server-to-database</div>
        </div>

        <div className="rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-5">
          <div className="tt-mono-label text-[var(--tt-light-ink-muted)]">RLS SECURITY</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--tt-success)]">
            <ShieldCheck className="size-3.5" />
            <span>ANON READ ONLY</span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--tt-light-ink-secondary)]">Zero service-role keys exposed</div>
        </div>
      </section>

      {/* Query Results / Diagnosis */}
      <section className="rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tt-light-border)] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Terminal className="size-4 text-[var(--tt-accent)]" />
            <span className="font-semibold text-[var(--tt-light-ink)]">QUERY TARGET: public.locations</span>
          </div>
          <span className="font-mono text-xs text-[var(--tt-light-ink-muted)]">SELECT * FROM locations</span>
        </div>

        {error ? (
          <div className="rounded-[var(--tt-radius-control)] border border-[var(--tt-error)]/30 bg-[var(--tt-error)]/10 p-5 text-xs">
            <div className="mb-2 flex items-center gap-2 font-mono font-bold text-[var(--tt-error)]">
              <AlertTriangle className="size-4" />
              <span>QUERY FAILED / TABLE NOT FOUND</span>
            </div>
            <div className="mb-4 font-mono text-[var(--tt-light-ink)]">{error.message}</div>
            <div className="border-t border-[var(--tt-error)]/20 pt-3 text-[11px] leading-relaxed text-[var(--tt-light-ink-secondary)]">
              <strong className="text-[var(--tt-light-ink)]">Common causes:</strong>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>
                  Have you run the migration script in your Supabase SQL Editor to create the{" "}
                  <code className="font-mono text-[var(--tt-light-ink)]">locations</code> table?
                </li>
                <li>
                  Verify your <code className="font-mono text-[var(--tt-light-ink)]">.env.local</code> credentials
                  match your Supabase project.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-2 font-mono text-xs font-semibold text-[var(--tt-success)]">
              <CheckCircle2 className="size-4" />
              <span>CONNECTION ACTIVE &amp; QUERY EXECUTED SUCCESSFULLY</span>
            </div>

            <p className="mb-4 font-mono text-xs text-[var(--tt-light-ink-secondary)]">
              Found <strong className="text-[var(--tt-light-ink)]">{locations?.length || 0}</strong> location records in
              database.
            </p>

            {locations && locations.length > 0 ? (
              <div className="overflow-x-auto rounded-[var(--tt-radius-control)] border border-[var(--tt-light-border)]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-[var(--tt-light-border)] bg-[var(--tt-light-band)] text-[10px] uppercase text-[var(--tt-light-ink-muted)]">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Body</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Coordinates</th>
                      <th className="p-3">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--tt-light-border)]">
                    {locations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-[var(--tt-light-bg)]">
                        <td className="p-3 font-semibold text-[var(--tt-light-ink)]">{loc.name}</td>
                        <td className="p-3 text-[var(--tt-accent)]">{loc.planetary_body}</td>
                        <td className="p-3 text-[var(--tt-light-ink-secondary)]">{loc.location_role}</td>
                        <td className="tt-mono-data p-3 text-[var(--tt-light-ink-secondary)]">
                          {loc.latitude !== null && loc.longitude !== null
                            ? `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`
                            : "N/A"}
                        </td>
                        <td className="p-3 text-[10px] text-[var(--tt-light-ink-muted)]">{loc.id.substring(0, 8)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-[var(--tt-radius-control)] border border-dashed border-[var(--tt-light-border-strong)] p-8 text-center font-mono text-xs text-[var(--tt-light-ink-muted)]">
                The <code className="text-[var(--tt-light-ink)]">locations</code> table exists and is responding to
                queries, but currently contains 0 rows.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default function TestDbPage() {
  return (
    <main className="tt-surface-light min-h-screen py-12">
      <div className="tt-container flex flex-col gap-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--tt-light-ink-secondary)] transition-colors hover:text-[var(--tt-light-ink)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Back to Overview</span>
          </Link>
        </div>

        <header className="flex flex-col gap-2 border-b border-[var(--tt-light-border)] pb-6">
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--tt-accent)]">
            <Database className="size-4" aria-hidden="true" />
            <span className="tt-mono-label">SUPABASE DIAGNOSTIC HARNESS</span>
          </div>
          <h1 className="tt-display-m text-[var(--tt-light-ink)]">Read-Only Database Query Test</h1>
          <p className="max-w-2xl text-sm text-[var(--tt-light-ink-secondary)]">
            Verifies that Next.js Server Components can connect to Supabase PostgreSQL, authenticate via the public
            anonymous key, and execute a read-only query on <code className="font-mono">locations</code> with RLS active.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="flex h-64 flex-col items-center justify-center rounded-[var(--tt-radius-card)] border border-[var(--tt-light-border)] bg-[var(--tt-light-surface)] p-8 font-mono text-xs text-[var(--tt-light-ink-muted)]">
              <Loader2 className="mb-2 size-6 animate-spin text-[var(--tt-accent)]" />
              <span>CONNECTING TO SUPABASE POSTGRESQL...</span>
            </div>
          }
        >
          <TestDbContent />
        </Suspense>
      </div>
    </main>
  )
}
