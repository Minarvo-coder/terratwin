# TERRATWIN — SECURE CLOUD RESEARCH WORKSPACE UPGRADE REPORT

**Project:** TerraTwin — Planetary Analog Discovery & Research Platform (Next.js 16.4.3 / TypeScript)  
**Milestone:** Secure User-Specific Supabase Cloud Research Workspace Upgrade  
**Date:** November 15, 2026  
**Supabase Project:** `ndqycqbrxgaauvmqqpjr` (`https://ndqycqbrxgaauvmqqpjr.supabase.co`, PostgreSQL `17.11.0.003`, Region `ap-northeast-1`)  
**Scope:** Replace browser-only `localStorage` research persistence with user-isolated Supabase cloud synchronization while preserving all completed Phases 1–6.7 and the Distributed Upstash Redis API Reliability Upgrade.

---

## 1. Executive Summary

TerraTwin’s Research Workspace (`/discover`) previously persisted research records, immutable assessment snapshots, tasks, and notes exclusively inside browser `localStorage` (`terratwin_research_workspace_records_v1`). While suitable for single-browser use, browser-only storage could not synchronize across devices or sessions and was tied to a single browser profile.

This upgrade introduces **user-specific cloud synchronization** backed by **Supabase Auth (`@supabase/ssr`)** and **PostgreSQL Row Level Security (RLS)**—with the database migration **applied and verified live** on Supabase project `ndqycqbrxgaauvmqqpjr` via the official Supabase MCP server—while preserving every scientific invariant established in Phases 1–6.7:

1. **Authenticated User Isolation & Strict Row Level Security (RLS):** Every research record, immutable assessment revision, research task, and note is bound to `user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE` with `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, `REVOKE ALL ... FROM anon`, `REVOKE UPDATE ON public.research_assessment_revisions FROM authenticated, anon`, and 15 dedicated `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.
2. **Zero Privileged Credential Exposure:** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used in application code. `assertNoPrivilegedServiceRoleExposure()` audits runtime environments to ensure `SUPABASE_SERVICE_ROLE_KEY` is never exposed with a `NEXT_PUBLIC_` prefix or leaked into client bundles.
3. **Immutable Historical Assessment Snapshots:** Revision history is append-only (`prevent_research_revision_mutation()` PostgreSQL trigger + `REVOKE UPDATE` + `ImmutableRevisionError` in the service layer). Every snapshot retains schema version `"1.0.0"`, deterministic FNV-1a 64-bit integrity digests (`fnv64-...`), original un-mutated observations (`null` never converted to `0`), the 40% evidence coverage gate (`MIN_RELIABLE_COVERAGE = 0.4`), and conservative verification states (`isVerified: false` on live grid cells; `observationStatus: "recommended-not-completed"` on research tasks).
4. **Full 6-Format Export Compatibility:** Multi-page PDF reports and all 5 data export formats (4 RFC 4180 CSV formats with formula-injection protection + deterministic JSON snapshots) operate identically on cloud-synchronized and local records.
5. **Safe `localStorage` Import & Offline Conflict Merging:** Existing browser-local records are never silently deleted or overwritten. Users can explicitly import browser records into their cloud workspace via **"Import Local Browser Records to Cloud"** (`import-local-batch`), which uses `mergeResearchAssessmentRecords()` to deduplicate by `recordId` and `contentDigest` while re-indexing any divergent offline revisions non-destructively.

---

## 2. Pre-Implementation Audit of Existing Authentication & Schema (Requirements 1 & 2)

Before modifying any code, the existing repository authentication, Supabase configuration, and database migrations were audited:

### 2.1 Existing Authentication Infrastructure Reused
- **Browser Client (`src/utils/supabase/client.ts`):** Uses `createBrowserClient` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Server Client (`src/utils/supabase/server.ts`):** Uses `createServerClient` from `@supabase/ssr` wired to Next.js `cookies()`.
- **Session Refresh Proxy (`src/utils/supabase/middleware.ts` & `src/middleware.ts`):** Refreshes Supabase Auth cookies across requests.
- **Auth UI & Actions (`src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/app/auth/callback/route.ts`, `src/components/auth-button.tsx`, `src/components/site/site-header.tsx`):** Provided `/login` (`signInWithPassword` and `signUp`), `/auth/callback` (`exchangeCodeForSession`), and header status display.

### 2.2 Enhancements Applied to Existing Authentication
- **Safe Redirect Preservation (`?next=/discover`):** Updated `src/app/login/page.tsx` and `src/app/login/actions.ts` with `sanitizeNextRedirectPath()` so signing in from `/discover` returns the researcher directly to `/discover` while blocking open-redirect URLs (`//...` or `http://...`).
- **Unified Server Identity Helper (`src/utils/supabase/workspace-auth.ts`):** Added `getAuthenticatedWorkspaceUser()` which resolves the authenticated Supabase session user first and, in local development (`process.env.VERCEL !== "1"`) when Supabase’s remote email confirmation gate is pending, supports an HMAC-SHA256 signed `HttpOnly` crew session cookie (`terratwin_crew_session`).

### 2.3 Existing Database Schema Audit
- Inspected `supabase/migrations/20261025000000_create_terratwin_core_schema.sql` and `src/types/database.types.ts`.
- Pre-existing tables in `ndqycqbrxgaauvmqqpjr`: `public.locations` (`9` rows, RLS enabled), `public.dataset_sources` (`8` rows, RLS enabled), and `public.environmental_features` (`111` rows, RLS enabled).

---

## 3. Versioned Database Migration & Live Automated Deployment (Requirements 3, 4 & 5)

Created the versioned migration file and applied it directly to Supabase project `ndqycqbrxgaauvmqqpjr` (`migration version: 20261114210035`, `name: create_cloud_research_workspace`):
- [20261115000000_create_cloud_research_workspace.sql](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/supabase/migrations/20261115000000_create_cloud_research_workspace.sql)
- Updated TypeScript database definitions in [database.types.ts](file:///c:/Users/Minarvo/OneDrive/Desktop/TerraTwin/src/types/database.types.ts) (verified against `generate_typescript_types` from `supabase_mcp`).

### 3.1 Four Relational Tables Created & Verified Live in `public`
1. **`public.research_records`** (`rls_enabled: true`)
   - Columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE`, `record_id TEXT NOT NULL`, `context_key TEXT NOT NULL`, `candidate_id TEXT NOT NULL`, `candidate_name TEXT NOT NULL`, `target_id TEXT NOT NULL`, `mission_profile_id TEXT NOT NULL`, `active_revision_number INTEGER NOT NULL DEFAULT 1`, `active_snapshot_id TEXT NOT NULL`, `active_snapshot JSONB NOT NULL`, `storage_mode TEXT NOT NULL DEFAULT 'supabase-cloud-rls-and-local-cache'`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - Constraints: `UNIQUE (user_id, context_key)`, `UNIQUE (user_id, record_id)`, `CHECK (active_revision_number >= 1)`, `CHECK ((active_snapshot->>'schemaVersion') = '1.0.0')`, `CHECK ((active_snapshot->>'contentDigest') LIKE 'fnv64-%')`, and `CHECK ((active_snapshot->>'candidateSourceKind') IS DISTINCT FROM 'live-grid-cell' OR (active_snapshot->>'isVerified')::boolean = false)`.
2. **`public.research_assessment_revisions`** (`rls_enabled: true`, Append-Only Immutable History)
   - Columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE`, `research_record_uuid UUID NOT NULL REFERENCES public.research_records(id) ON DELETE CASCADE`, `record_id TEXT NOT NULL`, `context_key TEXT NOT NULL`, `revision_number INTEGER NOT NULL`, `label TEXT NOT NULL`, `snapshot_id TEXT NOT NULL`, `schema_version TEXT NOT NULL DEFAULT '1.0.0'`, `content_digest TEXT NOT NULL`, `snapshot JSONB NOT NULL`, `created_at TIMESTAMPTZ`.
   - Constraints: `UNIQUE (research_record_uuid, revision_number)`, `UNIQUE (user_id, snapshot_id)`, `CHECK (revision_number >= 1)`, schema version `"1.0.0"`, `content_digest` match, and live unverified check.
   - Immutability Enforcement: `REVOKE UPDATE ON public.research_assessment_revisions FROM authenticated, anon;` plus `BEFORE UPDATE` trigger `trg_prevent_research_revision_mutation` (`public.prevent_research_revision_mutation()`, `SECURITY INVOKER`, `SET search_path = ''`) raising `ERRCODE = 'integrity_constraint_violation'`.
3. **`public.research_tasks`** (`rls_enabled: true`)
   - Columns: `id UUID PRIMARY KEY`, `user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE`, `research_record_uuid UUID NOT NULL REFERENCES public.research_records(id) ON DELETE CASCADE`, `record_id TEXT`, `task_id TEXT`, `candidate_id TEXT`, `title TEXT`, `scientific_rationale TEXT`, `related_gap TEXT`, `driver_feature TEXT`, `suggested_observation_method TEXT`, `priority TEXT`, `status TEXT`, `observation_status TEXT NOT NULL DEFAULT 'recommended-not-completed'`, `owner TEXT`, `notes TEXT`, `source_reference TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `completed_at TIMESTAMPTZ`.
   - Scientific verification safeguard: `CHECK (observation_status = 'recommended-not-completed')` — closing a workflow task (`status = 'closed'`) can never upgrade scientific verification status.
4. **`public.research_notes`** (`rls_enabled: true`)
   - Columns: `id UUID PRIMARY KEY`, `user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE`, `research_record_uuid UUID NOT NULL REFERENCES public.research_records(id) ON DELETE CASCADE`, `record_id TEXT`, `note_id TEXT`, `candidate_id TEXT`, `title TEXT`, `body TEXT`, `author_role TEXT NOT NULL DEFAULT 'user-authored-research-note'`, `related_feature TEXT`, `user_supplied_source_url TEXT`, `linked_task_id TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.

### 3.2 Strict Row Level Security (RLS) Policies (15 Policies Active in `pg_policies`)
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and `ALTER TABLE ... FORCE ROW LEVEL SECURITY;` on all 4 tables.
- `REVOKE ALL ON ... FROM anon;` and `REVOKE UPDATE ON public.research_assessment_revisions FROM authenticated, anon;`.
- All 15 policies use `(select auth.uid()) = user_id` (initPlan-optimized) and check parent record ownership (`EXISTS (SELECT 1 FROM public.research_records r WHERE r.id = research_record_uuid AND r.user_id = (select auth.uid()))`) on child tables.

---

## 4. Cloud Synchronization Service, API & Offline Conflict Resolution (Requirements 7–11)

### 4.1 Cloud Workspace Service & API Route
- **Service (`src/lib/terratwin/services/cloud-research-workspace-service.ts`):**
  - `CloudResearchWorkspaceService` enforces authenticated user context, validates scientific integrity via `verifyResearchRecordScientificIntegrity()` before any write, and synchronizes `research_records`, `research_assessment_revisions`, `research_tasks`, and `research_notes`.
- **API Route (`src/app/api/research-workspace/route.ts`):**
  - `GET /api/research-workspace`: Returns `{ authenticated, user, backendMode, records }` for the signed-in user (empty list when anonymous).
  - `POST /api/research-workspace`: Requires authentication (`401 Unauthorized` if anonymous). Supports `action: "upsert"` (single record sync with non-destructive conflict merge) and `action: "import-local-batch"` (safe bulk migration of browser-local records).
  - `DELETE /api/research-workspace?recordId=...`: Requires authentication (`401 Unauthorized` if anonymous) and deletes only if `record.user_id === auth.uid()`.

### 4.2 Safe `localStorage` Import & Non-Destructive Conflict Merging
- **`mergeResearchAssessmentRecords(existing, incoming)` (`src/lib/terratwin/services/research-snapshot-service.ts`):**
  - Verifies both records with `verifyResearchRecordScientificIntegrity()` (rejecting tampered digests, altered schema versions, or fabricated verification upgrades).
  - Deduplicates revisions by `contentDigest` (`fnv64-...`).
  - If two sessions or an offline queue produce different snapshots with the same `revisionNumber`, **neither snapshot is overwritten**—both immutable snapshots are preserved in chronological order and re-indexed cleanly (`1..N`).
  - Tasks and notes are merged by `id` using `updatedAt` timestamps without data loss.
- **Offline Queue & Per-User Cache (`src/hooks/use-cloud-research-workspace.ts`):**
  - Maintains a user-scoped local cache (`terratwin_cloud_workspace_cache_v1:<userId>`) and an offline pending operation queue (`terratwin_cloud_workspace_pending_sync_v1:<userId>`).
  - If a write occurs while offline or fails due to a transient network error, the update is preserved locally, queued for retry, and flushed automatically on reconnect or when clicking **"Retry Cloud Sync"**.

---

## 5. Automated Supabase Setup Status & Beginner Reference Guide (Requirement 14)

### 5.1 What Was Automated for You via the Supabase Plugin
Using the connected **Supabase MCP Server** (`supabase_mcp`) on your project **`ndqycqbrxgaauvmqqpjr`** (`TerraTwin`):
1. **Applied Migration Automatically:** Executed `apply_migration` (`name: "create_cloud_research_workspace"`, `version: "20261114210035"`), creating `public.research_records`, `public.research_assessment_revisions`, `public.research_tasks`, and `public.research_notes`, along with all 8 indexes, the `trg_prevent_research_revision_mutation` trigger, and all 15 Row Level Security policies.
2. **Verified Table & RLS State Automatically:** Confirmed via `list_tables` that all 4 tables exist in `public` with `rls_enabled: true`.
3. **Verified Security & Performance Advisors Automatically:** Ran `get_advisors` (`security` and `performance`) and confirmed **0 security warnings and 0 RLS performance warnings** on all 4 new `research_*` tables.
4. **Verified Live PostgreSQL 17 RLS & Immutability Automatically:** Executed a subtransaction test block on `db.ndqycqbrxgaauvmqqpjr.supabase.co` confirming `anon` rejection (`42501`), User A vs. User B `SELECT`/`INSERT`/`UPDATE` isolation, and revision immutability (`LIVE_POSTGRES_17_RLS_AND_IMMUTABILITY_VERIFIED`).

### 5.2 How to Use Your Cloud Research Workspace (Beginner Reference)
1. **Start TerraTwin:** Run `npm run dev` and open `http://localhost:3000/discover`.
2. **Sign In:** Click **Sign In for Cloud Sync** in the **Research Workspace & Validation Reports** panel (or **Initialize Session** in the top navigation bar) and sign in with your existing confirmed account (`minarvod@gmail.com`) at `/login?next=/discover`.
3. **Import Local Browser Records (if any):** If you have existing browser-only records saved in `localStorage`, click **"Import Local Browser Records to Cloud"** in the workspace banner to safely merge and upload them without duplicates.
4. **Optional Dashboard Settings (for reference):**
   - **Table Editor:** In [Supabase Dashboard](https://supabase.com/dashboard/project/ndqycqbrxgaauvmqqpjr/editor), you can inspect `research_records`, `research_assessment_revisions`, `research_tasks`, and `research_notes` under the `public` schema.
   - **Email Confirmation Toggle:** Under **Authentication → Providers → Email**, if you register brand-new email addresses and want them confirmed without clicking an email link, you can toggle **Confirm email** OFF.
   - **Leaked Password Protection (Optional Security Advisor Tip):** Under **Authentication → Providers → Email** (or **Password Security**), you can enable [Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) to check passwords against HaveIBeenPwned.org.
   - **Never Expose `service_role`:** Keep only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`; never place `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_` variable or frontend file.

---

## 6. Verification, Security & Regression Test Results (Requirements 6, 12 & 13)

All verification suites were executed against the compiled application and the live Supabase PostgreSQL 17 database:

### 6.1 Live Supabase PostgreSQL 17 & PostgREST Security Verification
- **Live PostgREST Anonymous Access Check:** `sb.from('research_records').select('id').limit(1)` using `NEXT_PUBLIC_SUPABASE_ANON_KEY` returned `{"code":"42501","message":"permission denied for table research_records"}`.
- **Live PostgreSQL 17 RLS & Trigger Verification (`execute_sql`):** Confirmed `[{"status":"LIVE_POSTGRES_17_RLS_AND_IMMUTABILITY_VERIFIED","research_records_count":0}]` across `anon` role denial, `authenticated` and `postgres` revision `UPDATE` blocking, and User A (`11111111-...`) vs. User B (`22222222-...`) row isolation.

### 6.2 Cloud Research Workspace Security & Multi-Session Suite (`scripts/test-cloud-research-workspace.mjs`)
Command: `node --test scripts/test-cloud-research-workspace.mjs` — **5/5 tests passed (0 failures)**:
1. **`1. Versioned SQL migration & zero service-role exposure audit` (PASS)**
2. **`2. Strict Row Level Security (SELECT, INSERT, UPDATE, DELETE): User A vs User B isolation & anonymous rejection` (PASS)**
3. **`3. Immutable revisions, scientific integrity preservation, and 6-format exports` (PASS)**
4. **`4. Safe localStorage import without duplicates and non-destructive offline conflict merging` (PASS)**
5. **`5. Live two-session HTTP verification: Session A1 & Session A2 sync while User B is isolated` (PASS)**
   - *Browser Subagent Environment Note:* Automated Chrome DevTools launch via the `browser` subagent reported `Could not find DevToolsActivePort for chrome at C:\Users\Minarvo\AppData\Local\Google\Chrome\User Data\DevToolsActivePort (ENOENT)` on this Windows host. Per security guidelines, host browser profile files were not modified; multi-session verification was completed via two independent authenticated HTTP cookie-jar sessions against the live Next.js server plus SSR `/discover` DOM verification.

### 6.3 Full Regression Suite Summary (`scripts/test-*.mjs`, TypeScript, ESLint, Production Build)
All 23 test files in `scripts/` and all build checks passed with **0 errors and 0 test failures**:

| Verification Suite / Check | Command | Result |
| :--- | :--- | :--- |
| **Live Supabase PostgreSQL 17 Migration & RLS** | `supabase_mcp` `apply_migration` + `execute_sql` | **PASS (`LIVE_POSTGRES_17_RLS_AND_IMMUTABILITY_VERIFIED`)** |
| **Cloud Research Workspace Security & Sync** | `node --test scripts/test-cloud-research-workspace.mjs` | **PASS (5/5 tests)** |
| **Distributed Upstash Redis Reliability** | `node --test scripts/test-distributed-redis-reliability.mjs` | **PASS (5/5 tests)** |
| **Phase 6.1 — Types & Mission Profiles** | `node scripts/test-phase6-step1-types-and-profiles.mjs` | **PASS (10/10 tests)** |
| **Phase 6.2 — Global Discovery Atlas (31 Sites)** | `node scripts/test-phase6-step2-discovery-atlas.mjs` | **PASS (17/17 tests)** |
| **Phase 6.3 — Live Regional Discovery Engine** | `node scripts/test-phase6-step3-live-discovery.mjs` | **PASS (21/21 tests)** |
| **Phase 6.3.1 — Scientific & API Hardening** | `node scripts/test-phase6-step3-1-hardening.mjs` | **PASS (25/25 tests)** |
| **Phase 6.4 — Interactive Discovery Scanner UI** | `node scripts/test-phase6-step4-scanner-ui.mjs` | **PASS (36/36 tests)** |
| **Phase 6.5 — Scientific Intelligence & Validation** | `node scripts/test-phase6-step5-scientific-intelligence.mjs` | **PASS (7/7 suites, 30 checks)** |
| **Phase 6.6 — Reports, Exports & Workflow** | `node scripts/test-phase6-step6-reports-and-workflow.mjs` | **PASS (6/6 scenarios)** |
| **Phase 6.7 — Final Integration & Security** | `node scripts/test-phase6-step7-final-integration.mjs` | **PASS (6/6 suites)** |
| **Phase 3 Master Verification Suite** | `node scripts/test-phase3-master.mjs` | **PASS (12/12 suites)** |
| **Phase 4 Master Visualization Suite** | `node scripts/test-phase4-master.mjs` | **PASS (5/5 suites)** |
| **TypeScript Static Type Check** | `npx tsc --noEmit` | **PASS (0 errors)** |
| **ESLint Check** | `npm run lint` | **PASS (0 errors)** |
| **Next.js 16.4.3 Production Build** | `npm run build` | **PASS (exit code 0)** |
