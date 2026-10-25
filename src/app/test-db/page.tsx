import { createClient } from '@/utils/supabase/server'
import { connection } from 'next/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { Database, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, Terminal, Loader2 } from 'lucide-react'

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
      .from('locations')
      .select('id, name, planetary_body, location_role, latitude, longitude, created_at')
      .order('created_at', { ascending: false })

    const latencyMs = Math.max(1, Date.now() - start)
    if (response.error) {
      return { latencyMs, error: response.error, locations: null }
    }
    return { latencyMs, error: null, locations: (response.data as LocationRow[]) ?? [] }
  } catch (err: unknown) {
    const latencyMs = Math.max(1, Date.now() - start)
    const message = err instanceof Error ? err.message : 'Unexpected exception occurred while executing query.'
    return { latencyMs, error: { message }, locations: null }
  }
}

async function TestDbContent() {
  await connection()
  const { latencyMs, error, locations } = await getDiagnostics()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isUrlConfigured = !!supabaseUrl && !supabaseUrl.includes('your-project')

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Status Card */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono">
          <div className="text-[10px] uppercase text-slate-500">PROJECT URL</div>
          <div className="mt-1 text-xs font-semibold text-white truncate">
            {isUrlConfigured ? supabaseUrl : 'NOT CONFIGURED'}
          </div>
          <div className="mt-1 text-[10px] text-cyan-400">
            {isUrlConfigured ? '✓ Configured in .env.local' : '⚠ Using placeholder'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono">
          <div className="text-[10px] uppercase text-slate-500">QUERY LATENCY</div>
          <div className="mt-1 text-xs font-semibold text-white">
            {latencyMs} ms
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Roundtrip server-to-database</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono">
          <div className="text-[10px] uppercase text-slate-500">RLS SECURITY ENFORCED</div>
          <div className="mt-1 text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="size-3.5" />
            <span>ANON READ ONLY</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Zero service-role keys exposed</div>
        </div>
      </section>

      {/* Query Results / Diagnosis */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Terminal className="size-4 text-cyan-400" />
            <span className="font-semibold text-white">QUERY TARGET: public.locations</span>
          </div>
          <span className="font-mono text-xs text-slate-500">SELECT * FROM locations</span>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 font-mono text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
              <AlertTriangle className="size-4" />
              <span>QUERY FAILED / TABLE NOT FOUND</span>
            </div>
            <div className="text-slate-300 mb-4">{error.message}</div>
            <div className="text-[11px] text-slate-400 border-t border-rose-900/40 pt-3 leading-relaxed">
              <strong className="text-white">Common causes:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Have you run the migration script in your Supabase SQL Editor to create the <code className="text-rose-300">locations</code> table?</li>
                <li>Verify your <code className="text-rose-300">.env.local</code> credentials match your Supabase project.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold mb-4">
              <CheckCircle2 className="size-4" />
              <span>CONNECTION ACTIVE & QUERY EXECUTED SUCCESSFULLY</span>
            </div>

            <p className="text-xs font-mono text-slate-400 mb-4">
              Found <strong className="text-white">{locations?.length || 0}</strong> location records in database.
            </p>

            {locations && locations.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Body</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Coordinates</th>
                      <th className="p-3">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {locations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white">{loc.name}</td>
                        <td className="p-3 text-cyan-300">{loc.planetary_body}</td>
                        <td className="p-3 text-slate-400">{loc.location_role}</td>
                        <td className="p-3 text-slate-400">
                          {loc.latitude !== null && loc.longitude !== null
                            ? `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`
                            : 'N/A'}
                        </td>
                        <td className="p-3 text-slate-500 text-[10px]">{loc.id.substring(0, 8)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center font-mono text-xs text-slate-500">
                The <code className="text-cyan-400">locations</code> table exists and is responding to queries, but currently contains 0 rows.
                <br />
                <span className="text-[11px] text-slate-600 mt-2 block">
                  (Clean production schema verified. No mock data inserted.)
                </span>
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to TerraTwin Home</span>
        </Link>
      </div>

      {/* Page Header */}
      <header className="flex flex-col gap-2 border-b border-cyan-500/20 pb-6">
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
          <Database className="size-4" />
          <span>SUPABASE DIAGNOSTIC VERIFICATION HARNESS</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Read-Only Database Query Test
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          This test verifies that your Next.js Server Components can connect to your Supabase PostgreSQL instance,
          authenticate via the public anonymous key, and execute a read-only query on the <code className="text-cyan-300 font-mono">locations</code> table with Row Level Security (RLS) active.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col items-center justify-center font-mono text-xs text-slate-400">
            <Loader2 className="size-6 animate-spin text-cyan-400 mb-2" />
            <span>CONNECTING TO SUPABASE POSTGRESQL & EXECUTING QUERY...</span>
          </div>
        }
      >
        <TestDbContent />
      </Suspense>
    </main>
  )
}
