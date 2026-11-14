import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Json } from "../../../types/database.types.ts"
import type { FeatureKey } from "../types.ts"
import {
  RESEARCH_CLOUD_STORAGE_DISCLOSURE,
  type AuthenticatedWorkspaceUser,
  type CloudBackendPersistenceMode,
  type ResearchAssessmentRecord,
  type ResearchAssessmentRevision,
  type ResearchSnapshot,
  type ResearchTask,
  type ResearchValidationNote,
} from "../types/research-workflow.ts"
import {
  deepCloneJson,
  mergeResearchAssessmentRecords,
  verifyResearchRecordScientificIntegrity,
  verifySnapshotIntegrity,
} from "./research-snapshot-service.ts"

export const VERIFIED_CREW_SESSION_COOKIE = "terratwin_verified_crew_session"

const CREW_IDENTITY_FILE = resolve(
  process.cwd(),
  ".next",
  "cache",
  "terratwin-crew-identities.json"
)

interface StoredCrewIdentity {
  id: string
  email: string
  saltHex: string
  passwordHashHex: string
  createdAt: string
}

function getSessionSigningKey(): string {
  const seed =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "terratwin-local-crew-hmac-key-v1"
  return createHmac("sha256", "terratwin-session-signing-v1").update(seed).digest("hex")
}

export function deterministicUserUuidFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  const hex = createHmac("sha256", "terratwin-crew-uuid-v5").update(normalized).digest("hex")
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-")
}

function loadCrewIdentities(): Record<string, StoredCrewIdentity> {
  try {
    if (existsSync(CREW_IDENTITY_FILE)) {
      return JSON.parse(readFileSync(CREW_IDENTITY_FILE, "utf8")) as Record<
        string,
        StoredCrewIdentity
      >
    }
  } catch {
    // Ignore missing cache
  }
  return {}
}

function saveCrewIdentities(map: Record<string, StoredCrewIdentity>): void {
  try {
    mkdirSync(dirname(CREW_IDENTITY_FILE), { recursive: true })
    writeFileSync(CREW_IDENTITY_FILE, JSON.stringify(map, null, 2), "utf8")
  } catch {
    // Ignore write failure in read-only env
  }
}

export function registerOrVerifyLocalCrewIdentity(params: {
  email: string
  password: string
  preferredUserId?: string
  mode: "signup" | "login"
}): { ok: boolean; user?: AuthenticatedWorkspaceUser; error?: string } {
  const cleanEmail = params.email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { ok: false, error: "Valid email address is required." }
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." }
  }

  const identities = loadCrewIdentities()
  const existing = identities[cleanEmail]

  if (params.mode === "signup") {
    const saltHex = createHmac("sha256", "terratwin-salt")
      .update(cleanEmail)
      .digest("hex")
      .slice(0, 32)
    const passwordHashHex = scryptSync(params.password, saltHex, 32).toString("hex")
    const id = existing?.id ?? params.preferredUserId ?? deterministicUserUuidFromEmail(cleanEmail)
    identities[cleanEmail] = {
      id,
      email: cleanEmail,
      saltHex,
      passwordHashHex,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    saveCrewIdentities(identities)
    return {
      ok: true,
      user: {
        id,
        email: cleanEmail,
        authProvider: "verified-crew-session",
      },
    }
  }

  if (!existing) {
    return { ok: false, error: "Invalid login credentials" }
  }

  const computedHash = scryptSync(params.password, existing.saltHex, 32)
  const expectedHash = Buffer.from(existing.passwordHashHex, "hex")
  if (
    computedHash.length !== expectedHash.length ||
    !timingSafeEqual(computedHash, expectedHash)
  ) {
    return { ok: false, error: "Invalid login credentials" }
  }

  return {
    ok: true,
    user: {
      id: existing.id,
      email: existing.email,
      authProvider: "verified-crew-session",
    },
  }
}

export function signCrewSessionToken(user: AuthenticatedWorkspaceUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      authProvider: user.authProvider,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
    "utf8"
  ).toString("base64url")
  const sig = createHmac("sha256", getSessionSigningKey()).update(payload).digest("base64url")
  return `${payload}.${sig}`
}

export function verifyCrewSessionToken(
  token: string | undefined
): AuthenticatedWorkspaceUser | null {
  if (!token || !token.includes(".")) return null
  const [payload, sig] = token.split(".")
  if (!payload || !sig) return null

  const expectedSig = createHmac("sha256", getSessionSigningKey())
    .update(payload)
    .digest("base64url")

  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      id?: string
      email?: string
      exp?: number
    }
    if (!parsed.id || !parsed.email || (parsed.exp && Date.now() > parsed.exp)) {
      return null
    }
    return {
      id: parsed.id,
      email: parsed.email,
      authProvider: "verified-crew-session",
    }
  } catch {
    return null
  }
}

export function sanitizeNextRedirectPath(rawNext: unknown): string {
  if (typeof rawNext !== "string") return "/"
  const trimmed = rawNext.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/"
  }
  return trimmed
}

export class RlsSecurityError extends Error {
  readonly code: "UNAUTHENTICATED" | "RLS_VIOLATION"
  readonly statusCode: 401 | 403

  constructor(
    message: string,
    code: "UNAUTHENTICATED" | "RLS_VIOLATION" = "RLS_VIOLATION",
    statusCode: 401 | 403 = 403
  ) {
    super(message)
    this.name = "RlsSecurityError"
    this.code = code
    this.statusCode = statusCode
  }
}

export class ImmutableRevisionError extends Error {
  readonly code = "IMMUTABLE_REVISION_VIOLATION"
  readonly statusCode = 409

  constructor(message: string) {
    super(message)
    this.name = "ImmutableRevisionError"
  }
}

type RecordRow = Database["public"]["Tables"]["research_records"]["Row"]
type RevisionRow = Database["public"]["Tables"]["research_assessment_revisions"]["Row"]
type TaskRow = Database["public"]["Tables"]["research_tasks"]["Row"]
type NoteRow = Database["public"]["Tables"]["research_notes"]["Row"]

interface RelationalTablesState {
  research_records: RecordRow[]
  research_assessment_revisions: RevisionRow[]
  research_tasks: TaskRow[]
  research_notes: NoteRow[]
}

/**
 * Verifies that no privileged Supabase service_role credentials are exposed
 * in NEXT_PUBLIC_* environment variables.
 */
export function assertNoPrivilegedServiceRoleExposure(
  env: Record<string, string | undefined> = process.env
): { safe: true } {
  for (const [key, val] of Object.entries(env)) {
    if (!val) continue
    const upperKey = key.toUpperCase()
    if (upperKey.startsWith("NEXT_PUBLIC_") && upperKey.includes("SERVICE_ROLE")) {
      throw new Error(
        `Security violation: privileged service-role key "${key}" must never be prefixed with NEXT_PUBLIC_.`
      )
    }
    if (upperKey.startsWith("NEXT_PUBLIC_") && val.includes(".") && val.split(".").length === 3) {
      try {
        const payloadJson = Buffer.from(val.split(".")[1], "base64url").toString("utf8")
        if (payloadJson.includes('"role":"service_role"')) {
          throw new Error(
            `Security violation: NEXT_PUBLIC_ variable "${key}" contains a privileged service_role JWT.`
          )
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("Security violation:")) {
          throw err
        }
      }
    }
  }
  return { safe: true }
}

/**
 * Relational 4-table store that enforces the exact PostgreSQL Row Level Security (RLS),
 * foreign-key ownership checks, and immutable revision trigger semantics defined in
 * `supabase/migrations/20261115000000_create_cloud_research_workspace.sql`.
 */
export class RlsEnforcedRelationalWorkspaceStore {
  private state: RelationalTablesState = {
    research_records: [],
    research_assessment_revisions: [],
    research_tasks: [],
    research_notes: [],
  }
  private readonly persistFilePath?: string

  constructor(options?: { persistFilePath?: string }) {
    this.persistFilePath = options?.persistFilePath
    this.reloadFromDisk()
  }

  private reloadFromDisk(): void {
    if (!this.persistFilePath) return
    try {
      if (existsSync(this.persistFilePath)) {
        const raw = readFileSync(this.persistFilePath, "utf8")
        const parsed = JSON.parse(raw) as Partial<RelationalTablesState>
        this.state = {
          research_records: Array.isArray(parsed.research_records) ? parsed.research_records : [],
          research_assessment_revisions: Array.isArray(parsed.research_assessment_revisions)
            ? parsed.research_assessment_revisions
            : [],
          research_tasks: Array.isArray(parsed.research_tasks) ? parsed.research_tasks : [],
          research_notes: Array.isArray(parsed.research_notes) ? parsed.research_notes : [],
        }
      }
    } catch {
      // Keep clean in-memory state if disk cache does not exist yet
    }
  }

  private flushToDisk(): void {
    if (!this.persistFilePath) return
    try {
      mkdirSync(dirname(this.persistFilePath), { recursive: true })
      writeFileSync(this.persistFilePath, JSON.stringify(this.state, null, 2), "utf8")
    } catch {
      // Ignore write failures in read-only sandboxes
    }
  }

  private requireAuthUid(authUid: string | null | undefined): string {
    const clean = authUid?.trim()
    if (!clean) {
      throw new RlsSecurityError(
        "Anonymous access denied by Row Level Security: authenticated user session required.",
        "UNAUTHENTICATED",
        401
      )
    }
    return clean
  }

  /**
   * Direct low-level table operations used to test and enforce SELECT, INSERT, UPDATE, DELETE RLS policies.
   */
  selectRecords(authUid: string | null | undefined): RecordRow[] {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()
    return deepCloneJson(
      this.state.research_records
        .filter((r) => r.user_id === uid)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    )
  }

  selectRevisions(authUid: string | null | undefined, researchRecordUuid?: string): RevisionRow[] {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()
    return deepCloneJson(
      this.state.research_assessment_revisions
        .filter(
          (r) =>
            r.user_id === uid &&
            (!researchRecordUuid || r.research_record_uuid === researchRecordUuid)
        )
        .sort((a, b) => a.revision_number - b.revision_number)
    )
  }

  selectTasks(authUid: string | null | undefined, researchRecordUuid?: string): TaskRow[] {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()
    return deepCloneJson(
      this.state.research_tasks.filter(
        (t) =>
          t.user_id === uid &&
          (!researchRecordUuid || t.research_record_uuid === researchRecordUuid)
      )
    )
  }

  selectNotes(authUid: string | null | undefined, researchRecordUuid?: string): NoteRow[] {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()
    return deepCloneJson(
      this.state.research_notes
        .filter(
          (n) =>
            n.user_id === uid &&
            (!researchRecordUuid || n.research_record_uuid === researchRecordUuid)
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    )
  }

  insertRecordRow(
    authUid: string | null | undefined,
    insert: Database["public"]["Tables"]["research_records"]["Insert"]
  ): RecordRow {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()

    const rowUserId = insert.user_id ?? uid
    if (rowUserId !== uid) {
      throw new RlsSecurityError(
        `RLS WITH CHECK violation on public.research_records: user "${uid}" cannot INSERT row with user_id "${rowUserId}".`,
        "RLS_VIOLATION",
        403
      )
    }

    // Prevent hijacking another user's record_id
    const conflictingRecordId = this.state.research_records.find(
      (r) => r.record_id === insert.record_id && r.user_id !== uid
    )
    if (conflictingRecordId) {
      throw new RlsSecurityError(
        `RLS violation on public.research_records: record_id "${insert.record_id}" belongs to another user.`,
        "RLS_VIOLATION",
        403
      )
    }

    const verifiedSnap = verifySnapshotIntegrity(insert.active_snapshot as unknown as ResearchSnapshot)
    const now = new Date().toISOString()

    const row: RecordRow = {
      id: insert.id ?? randomUUID(),
      user_id: uid,
      record_id: insert.record_id,
      context_key: insert.context_key,
      candidate_id: insert.candidate_id,
      candidate_name: insert.candidate_name,
      target_id: insert.target_id,
      mission_profile_id: insert.mission_profile_id,
      active_revision_number: insert.active_revision_number ?? verifiedSnap.revisionNumber,
      active_snapshot_id: insert.active_snapshot_id,
      active_snapshot: verifiedSnap as unknown as Json,
      storage_mode: insert.storage_mode ?? "supabase-cloud-rls-and-local-cache",
      created_at: insert.created_at ?? now,
      updated_at: insert.updated_at ?? now,
    }

    this.state.research_records.push(row)
    this.flushToDisk()
    return deepCloneJson(row)
  }

  updateRecordRow(
    authUid: string | null | undefined,
    recordUuid: string,
    patch: Database["public"]["Tables"]["research_records"]["Update"]
  ): RecordRow {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()

    const idx = this.state.research_records.findIndex((r) => r.id === recordUuid)
    if (idx === -1) {
      throw new RlsSecurityError(
        "RLS USING violation on public.research_records: target row not found or access denied.",
        "RLS_VIOLATION",
        403
      )
    }

    const existing = this.state.research_records[idx]
    if (existing.user_id !== uid) {
      throw new RlsSecurityError(
        `RLS USING violation on public.research_records: user "${uid}" cannot UPDATE record owned by another user.`,
        "RLS_VIOLATION",
        403
      )
    }
    if (patch.user_id !== undefined && patch.user_id !== uid) {
      throw new RlsSecurityError(
        `RLS WITH CHECK violation on public.research_records: cannot transfer ownership to "${patch.user_id}".`,
        "RLS_VIOLATION",
        403
      )
    }

    const nextActiveSnap = patch.active_snapshot
      ? (verifySnapshotIntegrity(patch.active_snapshot as unknown as ResearchSnapshot) as unknown as Json)
      : existing.active_snapshot

    const updated: RecordRow = {
      ...existing,
      ...patch,
      id: existing.id,
      user_id: uid,
      active_snapshot: nextActiveSnap,
      updated_at: patch.updated_at ?? new Date().toISOString(),
    }
    this.state.research_records[idx] = updated
    this.flushToDisk()
    return deepCloneJson(updated)
  }

  deleteRecordByUuid(authUid: string | null | undefined, recordUuid: string): void {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()

    const existing = this.state.research_records.find((r) => r.id === recordUuid)
    if (!existing || existing.user_id !== uid) {
      throw new RlsSecurityError(
        `RLS USING violation on public.research_records: user "${uid}" cannot DELETE record "${recordUuid}".`,
        "RLS_VIOLATION",
        403
      )
    }

    this.state.research_records = this.state.research_records.filter((r) => r.id !== recordUuid)
    this.state.research_assessment_revisions = this.state.research_assessment_revisions.filter(
      (r) => r.research_record_uuid !== recordUuid
    )
    this.state.research_tasks = this.state.research_tasks.filter(
      (t) => t.research_record_uuid !== recordUuid
    )
    this.state.research_notes = this.state.research_notes.filter(
      (n) => n.research_record_uuid !== recordUuid
    )
    this.flushToDisk()
  }

  insertRevisionRow(
    authUid: string | null | undefined,
    insert: Database["public"]["Tables"]["research_assessment_revisions"]["Insert"]
  ): RevisionRow {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()

    const rowUserId = insert.user_id ?? uid
    if (rowUserId !== uid) {
      throw new RlsSecurityError(
        `RLS WITH CHECK violation on public.research_assessment_revisions: user "${uid}" cannot INSERT revision for "${rowUserId}".`,
        "RLS_VIOLATION",
        403
      )
    }

    const parent = this.state.research_records.find((r) => r.id === insert.research_record_uuid)
    if (!parent || parent.user_id !== uid) {
      throw new RlsSecurityError(
        "RLS WITH CHECK violation on public.research_assessment_revisions: parent research_record_uuid does not belong to authenticated user.",
        "RLS_VIOLATION",
        403
      )
    }

    const verifiedSnap = verifySnapshotIntegrity(insert.snapshot as unknown as ResearchSnapshot)
    if (verifiedSnap.contentDigest !== insert.content_digest) {
      throw new Error("Revision content_digest column does not match verified snapshot digest.")
    }

    const existingRev = this.state.research_assessment_revisions.find(
      (r) =>
        r.research_record_uuid === insert.research_record_uuid &&
        (r.revision_number === insert.revision_number || r.snapshot_id === insert.snapshot_id)
    )
    if (existingRev) {
      if (existingRev.content_digest !== insert.content_digest) {
        throw new ImmutableRevisionError(
          `Historical research assessment revisions are immutable and cannot be overwritten (snapshot_id: ${existingRev.snapshot_id}).`
        )
      }
      return deepCloneJson(existingRev)
    }

    const row: RevisionRow = {
      id: insert.id ?? randomUUID(),
      user_id: uid,
      research_record_uuid: insert.research_record_uuid,
      record_id: insert.record_id,
      context_key: insert.context_key,
      revision_number: insert.revision_number,
      label: insert.label,
      snapshot_id: insert.snapshot_id,
      schema_version: insert.schema_version ?? "1.0.0",
      content_digest: insert.content_digest,
      snapshot: verifiedSnap as unknown as Json,
      created_at: insert.created_at ?? verifiedSnap.createdAt,
    }
    this.state.research_assessment_revisions.push(row)
    this.flushToDisk()
    return deepCloneJson(row)
  }

  updateRevisionRow(
    authUid: string | null | undefined,
    revisionUuid: string,
    patch?: Database["public"]["Tables"]["research_assessment_revisions"]["Update"]
  ): never {
    this.requireAuthUid(authUid)
    void patch
    throw new ImmutableRevisionError(
      `Historical research assessment revisions are immutable and cannot be modified (revision id: ${revisionUuid}). Append a new revision instead.`
    )
  }

  upsertTaskRow(
    authUid: string | null | undefined,
    insert: Database["public"]["Tables"]["research_tasks"]["Insert"]
  ): TaskRow {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()

    const rowUserId = insert.user_id ?? uid
    if (rowUserId !== uid) {
      throw new RlsSecurityError(
        `RLS WITH CHECK violation on public.research_tasks: user "${uid}" cannot write task for "${rowUserId}".`,
        "RLS_VIOLATION",
        403
      )
    }

    const parent = this.state.research_records.find((r) => r.id === insert.research_record_uuid)
    if (!parent || parent.user_id !== uid) {
      throw new RlsSecurityError(
        "RLS WITH CHECK violation on public.research_tasks: parent research_record_uuid does not belong to authenticated user.",
        "RLS_VIOLATION",
        403
      )
    }

    if (
      insert.observation_status !== undefined &&
      insert.observation_status !== "recommended-not-completed"
    ) {
      throw new Error(
        'Integrity constraint violation: research_tasks.observation_status must remain "recommended-not-completed".'
      )
    }

    const existingIdx = this.state.research_tasks.findIndex(
      (t) =>
        t.research_record_uuid === insert.research_record_uuid && t.task_id === insert.task_id
    )
    const now = new Date().toISOString()

    const row: TaskRow = {
      id: existingIdx >= 0 ? this.state.research_tasks[existingIdx].id : (insert.id ?? randomUUID()),
      user_id: uid,
      research_record_uuid: insert.research_record_uuid,
      record_id: insert.record_id,
      task_id: insert.task_id,
      candidate_id: insert.candidate_id,
      title: insert.title,
      scientific_rationale: insert.scientific_rationale,
      related_gap: insert.related_gap,
      driver_feature: insert.driver_feature ?? null,
      suggested_observation_method: insert.suggested_observation_method,
      priority: insert.priority,
      status: insert.status ?? "identified",
      observation_status: "recommended-not-completed",
      owner: insert.owner ? insert.owner.slice(0, 80) : null,
      notes: insert.notes ? insert.notes.slice(0, 500) : null,
      source_reference: insert.source_reference ?? null,
      created_at:
        existingIdx >= 0
          ? this.state.research_tasks[existingIdx].created_at
          : (insert.created_at ?? now),
      updated_at: insert.updated_at ?? now,
      completed_at: insert.completed_at ?? null,
    }

    if (existingIdx >= 0) {
      this.state.research_tasks[existingIdx] = row
    } else {
      this.state.research_tasks.push(row)
    }
    this.flushToDisk()
    return deepCloneJson(row)
  }

  insertNoteRow(
    authUid: string | null | undefined,
    insert: Database["public"]["Tables"]["research_notes"]["Insert"]
  ): NoteRow {
    const uid = this.requireAuthUid(authUid)
    this.reloadFromDisk()

    const rowUserId = insert.user_id ?? uid
    if (rowUserId !== uid) {
      throw new RlsSecurityError(
        `RLS WITH CHECK violation on public.research_notes: user "${uid}" cannot INSERT note for "${rowUserId}".`,
        "RLS_VIOLATION",
        403
      )
    }

    const parent = this.state.research_records.find((r) => r.id === insert.research_record_uuid)
    if (!parent || parent.user_id !== uid) {
      throw new RlsSecurityError(
        "RLS WITH CHECK violation on public.research_notes: parent research_record_uuid does not belong to authenticated user.",
        "RLS_VIOLATION",
        403
      )
    }

    const existing = this.state.research_notes.find(
      (n) =>
        n.research_record_uuid === insert.research_record_uuid && n.note_id === insert.note_id
    )
    if (existing) {
      return deepCloneJson(existing)
    }

    const now = new Date().toISOString()
    const row: NoteRow = {
      id: insert.id ?? randomUUID(),
      user_id: uid,
      research_record_uuid: insert.research_record_uuid,
      record_id: insert.record_id,
      note_id: insert.note_id,
      candidate_id: insert.candidate_id,
      title: insert.title.slice(0, 160),
      body: insert.body.slice(0, 2000),
      author_role: "user-authored-research-note",
      related_feature: insert.related_feature ?? "general",
      user_supplied_source_url: insert.user_supplied_source_url ?? null,
      linked_task_id: insert.linked_task_id ?? null,
      created_at: insert.created_at ?? now,
      updated_at: insert.updated_at ?? now,
    }
    this.state.research_notes.push(row)
    this.flushToDisk()
    return deepCloneJson(row)
  }

  clearAllForTesting(): void {
    this.state = {
      research_records: [],
      research_assessment_revisions: [],
      research_tasks: [],
      research_notes: [],
    }
    this.flushToDisk()
  }
}

const DEFAULT_FALLBACK_STORE_PATH = resolve(
  process.cwd(),
  ".next",
  "cache",
  "terratwin-cloud-rls-store.json"
)

let sharedServerFallbackStore: RlsEnforcedRelationalWorkspaceStore | null = null

export function getSharedServerRlsFallbackStore(): RlsEnforcedRelationalWorkspaceStore {
  if (!sharedServerFallbackStore) {
    sharedServerFallbackStore = new RlsEnforcedRelationalWorkspaceStore({
      persistFilePath: DEFAULT_FALLBACK_STORE_PATH,
    })
  }
  return sharedServerFallbackStore
}

function assembleRecordFromRelationalRows(
  recRow: RecordRow,
  revRows: RevisionRow[],
  taskRows: TaskRow[],
  noteRows: NoteRow[]
): ResearchAssessmentRecord {
  const revisions: ResearchAssessmentRevision[] = revRows
    .sort((a, b) => a.revision_number - b.revision_number)
    .map((r) => ({
      revisionNumber: r.revision_number,
      label: r.label,
      createdAt: r.created_at,
      snapshotId: r.snapshot_id,
      snapshot: r.snapshot as unknown as ResearchSnapshot,
    }))

  const activeSnapshot = (recRow.active_snapshot as unknown as ResearchSnapshot) ??
    revisions[revisions.length - 1]?.snapshot

  const tasks: ResearchTask[] = taskRows.map((t) => ({
    id: t.task_id,
    researchRecordId: recRow.record_id,
    candidateId: t.candidate_id,
    title: t.title,
    scientificRationale: t.scientific_rationale,
    relatedGap: t.related_gap,
    ...(t.driver_feature ? { driverFeature: t.driver_feature as FeatureKey } : {}),
    suggestedObservationMethod: t.suggested_observation_method,
    priority: t.priority,
    status: t.status,
    observationStatus: "recommended-not-completed",
    ...(t.owner ? { owner: t.owner } : {}),
    ...(t.notes ? { notes: t.notes } : {}),
    ...(t.source_reference ? { sourceReference: t.source_reference } : {}),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    ...(t.completed_at ? { completedAt: t.completed_at } : {}),
  }))

  const notes: ResearchValidationNote[] = noteRows
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((n) => ({
      id: n.note_id,
      researchRecordId: recRow.record_id,
      candidateId: n.candidate_id,
      title: n.title,
      body: n.body,
      authorRole: "user-authored-research-note",
      relatedFeature: (n.related_feature as FeatureKey | "general") ?? "general",
      ...(n.user_supplied_source_url ? { userSuppliedSourceUrl: n.user_supplied_source_url } : {}),
      ...(n.linked_task_id ? { linkedTaskId: n.linked_task_id } : {}),
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }))

  const assembled: ResearchAssessmentRecord = {
    recordId: recRow.record_id,
    contextKey: recRow.context_key,
    candidateId: recRow.candidate_id,
    candidateName: recRow.candidate_name,
    targetId: recRow.target_id,
    missionProfileId: recRow.mission_profile_id,
    createdAt: recRow.created_at,
    updatedAt: recRow.updated_at,
    storageMode: "supabase-cloud-rls-and-local-cache",
    storageNotice: RESEARCH_CLOUD_STORAGE_DISCLOSURE,
    ownerUserId: recRow.user_id,
    lastSyncedAt: recRow.updated_at,
    snapshot: activeSnapshot,
    revisionHistory:
      revisions.length > 0
        ? revisions
        : [
            {
              revisionNumber: activeSnapshot.revisionNumber ?? 1,
              label: activeSnapshot.revisionLabel,
              createdAt: activeSnapshot.createdAt,
              snapshotId: activeSnapshot.snapshotId,
              snapshot: activeSnapshot,
            },
          ],
    tasks,
    notes,
  }

  return verifyResearchRecordScientificIntegrity(assembled)
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase()
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    msg.includes("could not find the table") ||
    msg.includes('relation "public.research_records" does not exist')
  )
}

export interface CloudWorkspaceOperationResult {
  records: Record<string, ResearchAssessmentRecord>
  backendMode: CloudBackendPersistenceMode
  hadRevisionConflict?: boolean
  importedCount?: number
}

/**
 * High-level Cloud Research Workspace service supporting both live Supabase PostgreSQL RLS
 * and the strict RLS-enforced server store (for local verification or before the SQL migration
 * is pasted into the Supabase SQL Editor).
 */
export class CloudResearchWorkspaceService {
  private readonly supabase?: SupabaseClient<Database>
  private readonly fallbackStore: RlsEnforcedRelationalWorkspaceStore

  constructor(options?: {
    supabase?: SupabaseClient<Database>
    fallbackStore?: RlsEnforcedRelationalWorkspaceStore
  }) {
    assertNoPrivilegedServiceRoleExposure()
    this.supabase = options?.supabase
    this.fallbackStore = options?.fallbackStore ?? getSharedServerRlsFallbackStore()
  }

  private assertAuthenticatedUser(user: AuthenticatedWorkspaceUser | null | undefined): AuthenticatedWorkspaceUser {
    if (!user || !user.id || !user.email) {
      throw new RlsSecurityError(
        "Authentication required to access the Cloud Research Workspace.",
        "UNAUTHENTICATED",
        401
      )
    }
    return user
  }

  private listFromStore(userId: string): Record<string, ResearchAssessmentRecord> {
    const recRows = this.fallbackStore.selectRecords(userId)
    const revRows = this.fallbackStore.selectRevisions(userId)
    const taskRows = this.fallbackStore.selectTasks(userId)
    const noteRows = this.fallbackStore.selectNotes(userId)

    const out: Record<string, ResearchAssessmentRecord> = {}
    for (const recRow of recRows) {
      const assembled = assembleRecordFromRelationalRows(
        recRow,
        revRows.filter((r) => r.research_record_uuid === recRow.id),
        taskRows.filter((t) => t.research_record_uuid === recRow.id),
        noteRows.filter((n) => n.research_record_uuid === recRow.id)
      )
      out[assembled.contextKey] = assembled
    }
    return out
  }

  private upsertIntoStore(
    userId: string,
    incomingRaw: ResearchAssessmentRecord
  ): { record: ResearchAssessmentRecord; hadRevisionConflict: boolean } {
    if (incomingRaw.ownerUserId && incomingRaw.ownerUserId !== userId) {
      throw new RlsSecurityError(
        `RLS violation: User "${userId}" cannot create or update a record owned by "${incomingRaw.ownerUserId}".`,
        "RLS_VIOLATION",
        403
      )
    }

    const verifiedIncoming = verifyResearchRecordScientificIntegrity({
      ...incomingRaw,
      ownerUserId: userId,
      storageMode: "supabase-cloud-rls-and-local-cache",
    })

    const existingRecords = this.listFromStore(userId)
    const existingForContext = existingRecords[verifiedIncoming.contextKey]

    let finalRecord = verifiedIncoming
    let hadRevisionConflict = false

    if (existingForContext) {
      const mergeRes = mergeResearchAssessmentRecords(existingForContext, verifiedIncoming)
      finalRecord = {
        ...mergeRes.merged,
        ownerUserId: userId,
        storageMode: "supabase-cloud-rls-and-local-cache",
        storageNotice: RESEARCH_CLOUD_STORAGE_DISCLOSURE,
        lastSyncedAt: new Date().toISOString(),
      }
      hadRevisionConflict = mergeRes.hadRevisionConflict
    } else {
      finalRecord = {
        ...verifiedIncoming,
        ownerUserId: userId,
        storageMode: "supabase-cloud-rls-and-local-cache",
        storageNotice: RESEARCH_CLOUD_STORAGE_DISCLOSURE,
        lastSyncedAt: new Date().toISOString(),
      }
    }

    const existingRow = this.fallbackStore
      .selectRecords(userId)
      .find((r) => r.context_key === finalRecord.contextKey)

    let recordUuid: string
    if (existingRow) {
      const updatedRow = this.fallbackStore.updateRecordRow(userId, existingRow.id, {
        candidate_name: finalRecord.candidateName,
        active_revision_number: finalRecord.snapshot.revisionNumber,
        active_snapshot_id: finalRecord.snapshot.snapshotId,
        active_snapshot: finalRecord.snapshot as unknown as Json,
        updated_at: finalRecord.updatedAt,
      })
      recordUuid = updatedRow.id
    } else {
      const insertedRow = this.fallbackStore.insertRecordRow(userId, {
        user_id: userId,
        record_id: finalRecord.recordId,
        context_key: finalRecord.contextKey,
        candidate_id: finalRecord.candidateId,
        candidate_name: finalRecord.candidateName,
        target_id: finalRecord.targetId,
        mission_profile_id: String(finalRecord.missionProfileId),
        active_revision_number: finalRecord.snapshot.revisionNumber,
        active_snapshot_id: finalRecord.snapshot.snapshotId,
        active_snapshot: finalRecord.snapshot as unknown as Json,
        storage_mode: "supabase-cloud-rls-and-local-cache",
        created_at: finalRecord.createdAt,
        updated_at: finalRecord.updatedAt,
      })
      recordUuid = insertedRow.id
    }

    for (const rev of finalRecord.revisionHistory) {
      this.fallbackStore.insertRevisionRow(userId, {
        user_id: userId,
        research_record_uuid: recordUuid,
        record_id: finalRecord.recordId,
        context_key: finalRecord.contextKey,
        revision_number: rev.revisionNumber,
        label: rev.label,
        snapshot_id: rev.snapshotId,
        schema_version: rev.snapshot.schemaVersion,
        content_digest: rev.snapshot.contentDigest,
        snapshot: rev.snapshot as unknown as Json,
        created_at: rev.createdAt,
      })
    }

    for (const task of finalRecord.tasks) {
      this.fallbackStore.upsertTaskRow(userId, {
        user_id: userId,
        research_record_uuid: recordUuid,
        record_id: finalRecord.recordId,
        task_id: task.id,
        candidate_id: task.candidateId,
        title: task.title,
        scientific_rationale: task.scientificRationale,
        related_gap: task.relatedGap,
        driver_feature: task.driverFeature ?? null,
        suggested_observation_method: task.suggestedObservationMethod,
        priority: task.priority,
        status: task.status,
        observation_status: "recommended-not-completed",
        owner: task.owner ?? null,
        notes: task.notes ?? null,
        source_reference: task.sourceReference ?? null,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
        completed_at: task.completedAt ?? null,
      })
    }

    for (const note of finalRecord.notes) {
      this.fallbackStore.insertNoteRow(userId, {
        user_id: userId,
        research_record_uuid: recordUuid,
        record_id: finalRecord.recordId,
        note_id: note.id,
        candidate_id: note.candidateId,
        title: note.title,
        body: note.body,
        author_role: "user-authored-research-note",
        related_feature: note.relatedFeature ?? "general",
        user_supplied_source_url: note.userSuppliedSourceUrl ?? null,
        linked_task_id: note.linkedTaskId ?? null,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      })
    }

    return { record: finalRecord, hadRevisionConflict }
  }

  async listRecords(
    user: AuthenticatedWorkspaceUser | null | undefined
  ): Promise<CloudWorkspaceOperationResult> {
    const authUser = this.assertAuthenticatedUser(user)

    if (this.supabase && authUser.authProvider === "supabase-auth") {
      const { data: recRows, error: recErr } = await this.supabase
        .from("research_records")
        .select("*")
        .eq("user_id", authUser.id)
        .order("updated_at", { ascending: false })

      if (!recErr && recRows) {
        const [{ data: revRows }, { data: taskRows }, { data: noteRows }] = await Promise.all([
          this.supabase
            .from("research_assessment_revisions")
            .select("*")
            .eq("user_id", authUser.id)
            .order("revision_number", { ascending: true }),
          this.supabase.from("research_tasks").select("*").eq("user_id", authUser.id),
          this.supabase
            .from("research_notes")
            .select("*")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false }),
        ])

        const records: Record<string, ResearchAssessmentRecord> = {}
        for (const recRow of recRows) {
          const assembled = assembleRecordFromRelationalRows(
            recRow,
            (revRows ?? []).filter((r) => r.research_record_uuid === recRow.id),
            (taskRows ?? []).filter((t) => t.research_record_uuid === recRow.id),
            (noteRows ?? []).filter((n) => n.research_record_uuid === recRow.id)
          )
          records[assembled.contextKey] = assembled
        }
        return {
          records,
          backendMode: "supabase-postgres-rls",
        }
      }

      if (!isMissingTableError(recErr)) {
        throw new Error(`Supabase research_records query failed: ${recErr?.message ?? "unknown"}`)
      }
    }

    return {
      records: this.listFromStore(authUser.id),
      backendMode: "server-rls-fallback-pending-migration",
    }
  }

  async upsertRecord(
    user: AuthenticatedWorkspaceUser | null | undefined,
    incomingRecord: ResearchAssessmentRecord
  ): Promise<CloudWorkspaceOperationResult> {
    const authUser = this.assertAuthenticatedUser(user)
    if (incomingRecord.ownerUserId && incomingRecord.ownerUserId !== authUser.id) {
      throw new RlsSecurityError(
        `RLS violation: User "${authUser.id}" cannot create or modify a record owned by "${incomingRecord.ownerUserId}".`,
        "RLS_VIOLATION",
        403
      )
    }

    if (this.supabase && authUser.authProvider === "supabase-auth") {
      const currentList = await this.listRecords(authUser)
      if (currentList.backendMode === "supabase-postgres-rls") {
        const verifiedIncoming = verifyResearchRecordScientificIntegrity({
          ...incomingRecord,
          ownerUserId: authUser.id,
          storageMode: "supabase-cloud-rls-and-local-cache",
        })
        const existing = currentList.records[verifiedIncoming.contextKey]
        let finalRecord = verifiedIncoming
        let hadRevisionConflict = false
        if (existing) {
          const merged = mergeResearchAssessmentRecords(existing, verifiedIncoming)
          finalRecord = {
            ...merged.merged,
            ownerUserId: authUser.id,
            storageMode: "supabase-cloud-rls-and-local-cache",
            storageNotice: RESEARCH_CLOUD_STORAGE_DISCLOSURE,
            lastSyncedAt: new Date().toISOString(),
          }
          hadRevisionConflict = merged.hadRevisionConflict
        }

        const { data: upsertedRow, error: upErr } = await this.supabase
          .from("research_records")
          .upsert(
            {
              user_id: authUser.id,
              record_id: finalRecord.recordId,
              context_key: finalRecord.contextKey,
              candidate_id: finalRecord.candidateId,
              candidate_name: finalRecord.candidateName,
              target_id: finalRecord.targetId,
              mission_profile_id: String(finalRecord.missionProfileId),
              active_revision_number: finalRecord.snapshot.revisionNumber,
              active_snapshot_id: finalRecord.snapshot.snapshotId,
              active_snapshot: finalRecord.snapshot as unknown as Json,
              storage_mode: "supabase-cloud-rls-and-local-cache",
              updated_at: finalRecord.updatedAt,
            },
            { onConflict: "user_id,context_key" }
          )
          .select("*")
          .single()

        if (upErr || !upsertedRow) {
          throw new Error(`Supabase research_records upsert failed: ${upErr?.message ?? "no row"}`)
        }

        const recordUuid = upsertedRow.id
        const { data: existingRevs } = await this.supabase
          .from("research_assessment_revisions")
          .select("snapshot_id, content_digest")
          .eq("research_record_uuid", recordUuid)
          .eq("user_id", authUser.id)

        const existingSnapMap = new Map(
          (existingRevs ?? []).map((r) => [r.snapshot_id, r.content_digest])
        )

        for (const rev of finalRecord.revisionHistory) {
          if (existingSnapMap.has(rev.snapshotId)) {
            if (existingSnapMap.get(rev.snapshotId) !== rev.snapshot.contentDigest) {
              throw new ImmutableRevisionError(
                `Historical revision "${rev.snapshotId}" is immutable and cannot be modified.`
              )
            }
            continue
          }
          const { error: revErr } = await this.supabase
            .from("research_assessment_revisions")
            .insert({
              user_id: authUser.id,
              research_record_uuid: recordUuid,
              record_id: finalRecord.recordId,
              context_key: finalRecord.contextKey,
              revision_number: rev.revisionNumber,
              label: rev.label,
              snapshot_id: rev.snapshotId,
              schema_version: rev.snapshot.schemaVersion,
              content_digest: rev.snapshot.contentDigest,
              snapshot: rev.snapshot as unknown as Json,
              created_at: rev.createdAt,
            })
          if (revErr) {
            throw new Error(`Supabase revision insert failed: ${revErr.message}`)
          }
        }

        for (const task of finalRecord.tasks) {
          const { error: taskErr } = await this.supabase.from("research_tasks").upsert(
            {
              user_id: authUser.id,
              research_record_uuid: recordUuid,
              record_id: finalRecord.recordId,
              task_id: task.id,
              candidate_id: task.candidateId,
              title: task.title,
              scientific_rationale: task.scientificRationale,
              related_gap: task.relatedGap,
              driver_feature: task.driverFeature ?? null,
              suggested_observation_method: task.suggestedObservationMethod,
              priority: task.priority,
              status: task.status,
              observation_status: "recommended-not-completed",
              owner: task.owner ?? null,
              notes: task.notes ?? null,
              source_reference: task.sourceReference ?? null,
              created_at: task.createdAt,
              updated_at: task.updatedAt,
              completed_at: task.completedAt ?? null,
            },
            { onConflict: "research_record_uuid,task_id" }
          )
          if (taskErr) {
            throw new Error(`Supabase task upsert failed: ${taskErr.message}`)
          }
        }

        const { data: existingNotes } = await this.supabase
          .from("research_notes")
          .select("note_id")
          .eq("research_record_uuid", recordUuid)
          .eq("user_id", authUser.id)
        const existingNoteIds = new Set((existingNotes ?? []).map((n) => n.note_id))

        for (const note of finalRecord.notes) {
          if (existingNoteIds.has(note.id)) continue
          const { error: noteErr } = await this.supabase.from("research_notes").insert({
            user_id: authUser.id,
            research_record_uuid: recordUuid,
            record_id: finalRecord.recordId,
            note_id: note.id,
            candidate_id: note.candidateId,
            title: note.title,
            body: note.body,
            author_role: "user-authored-research-note",
            related_feature: note.relatedFeature ?? "general",
            user_supplied_source_url: note.userSuppliedSourceUrl ?? null,
            linked_task_id: note.linkedTaskId ?? null,
            created_at: note.createdAt,
            updated_at: note.updatedAt,
          })
          if (noteErr) {
            throw new Error(`Supabase note insert failed: ${noteErr.message}`)
          }
        }

        const refreshed = await this.listRecords(authUser)
        return {
          ...refreshed,
          hadRevisionConflict,
        }
      }
    }

    const { hadRevisionConflict } = this.upsertIntoStore(authUser.id, incomingRecord)
    return {
      records: this.listFromStore(authUser.id),
      backendMode: "server-rls-fallback-pending-migration",
      hadRevisionConflict,
    }
  }

  async deleteRecord(
    user: AuthenticatedWorkspaceUser | null | undefined,
    params: { contextKey: string; ownerUserId?: string }
  ): Promise<CloudWorkspaceOperationResult> {
    const authUser = this.assertAuthenticatedUser(user)
    if (params.ownerUserId && params.ownerUserId !== authUser.id) {
      throw new RlsSecurityError(
        `RLS violation: User "${authUser.id}" cannot delete a record belonging to "${params.ownerUserId}".`,
        "RLS_VIOLATION",
        403
      )
    }

    if (this.supabase && authUser.authProvider === "supabase-auth") {
      const { error } = await this.supabase
        .from("research_records")
        .delete()
        .eq("user_id", authUser.id)
        .eq("context_key", params.contextKey)

      if (!error) {
        return this.listRecords(authUser)
      }
      if (!isMissingTableError(error)) {
        throw new Error(`Supabase research_records delete failed: ${error.message}`)
      }
    }

    const userRows = this.fallbackStore.selectRecords(authUser.id)
    const targetRow = userRows.find((r) => r.context_key === params.contextKey)
    if (targetRow) {
      this.fallbackStore.deleteRecordByUuid(authUser.id, targetRow.id)
    }

    return {
      records: this.listFromStore(authUser.id),
      backendMode: "server-rls-fallback-pending-migration",
    }
  }

  async importLocalRecordsBatch(
    user: AuthenticatedWorkspaceUser | null | undefined,
    localRecords: Record<string, ResearchAssessmentRecord> | ResearchAssessmentRecord[]
  ): Promise<CloudWorkspaceOperationResult> {
    const authUser = this.assertAuthenticatedUser(user)
    const list = Array.isArray(localRecords) ? localRecords : Object.values(localRecords)

    let hadAnyConflict = false
    let importedCount = 0

    for (const rawRec of list) {
      const cleaned: ResearchAssessmentRecord = {
        ...rawRec,
        ownerUserId: authUser.id,
      }
      const res = await this.upsertRecord(authUser, cleaned)
      if (res.hadRevisionConflict) hadAnyConflict = true
      importedCount += 1
    }

    const finalState = await this.listRecords(authUser)
    return {
      ...finalState,
      hadRevisionConflict: hadAnyConflict,
      importedCount,
    }
  }
}
