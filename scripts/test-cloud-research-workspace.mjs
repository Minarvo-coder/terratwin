import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

try {
  const envLocalPath = resolve(process.cwd(), ".env.local")
  if (existsSync(envLocalPath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envLocalPath)
  }
} catch {
  // Ignore if .env.local is absent
}

import { SAMPLE_TARGETS } from "../src/lib/terratwin/sample-dataset.ts"
import {
  COMPARISON_FEATURES,
  GEOLOGICAL_RESEARCH_PROFILE,
  ROVER_TESTING_PROFILE,
} from "../src/lib/terratwin/config/comparison-config.ts"
import {
  computeAnalogSimilarity,
  evaluateFeatureComparison,
} from "../src/lib/terratwin/similarity-engine.ts"
import { buildLiveCandidateIntelligence } from "../src/lib/terratwin/services/candidate-intelligence-service.ts"
import {
  addUserResearchNote,
  appendAssessmentRevision,
  createResearchAssessmentRecord,
  serializeResearchRecordJson,
  updateResearchTaskStatus,
} from "../src/lib/terratwin/services/research-snapshot-service.ts"
import {
  assertNoPrivilegedServiceRoleExposure,
  CloudResearchWorkspaceService,
  ImmutableRevisionError,
  registerOrVerifyLocalCrewIdentity,
  RlsEnforcedRelationalWorkspaceStore,
  RlsSecurityError,
  signCrewSessionToken,
  VERIFIED_CREW_SESSION_COOKIE,
} from "../src/lib/terratwin/services/cloud-research-workspace-service.ts"
import {
  generateCandidateSummaryCsv,
  generateProvenanceManifestCsv,
  generateResearchTasksCsv,
  generateScientificFeaturesCsv,
} from "../src/lib/terratwin/utils/csv-export.ts"
import { generateScientificAssessmentPdf } from "../src/lib/terratwin/utils/pdf-report-generator.ts"

const ROOT = process.cwd()
const JEZERO_TARGET =
  SAMPLE_TARGETS.find((t) => t.id === "mars-jezero-delta") ?? SAMPLE_TARGETS[0]

function buildFixtureCandidateResult(
  id = "cell_salda_cloud_1",
  name = "Salda Cloud Screening Cell #1",
  envOverrides = {},
  profile = GEOLOGICAL_RESEARCH_PROFILE,
  target = JEZERO_TARGET
) {
  const environment = {
    meanSurfaceTempC: 11.8,
    diurnalTempRangeC: 14.2,
    annualPrecipitationMm: 420,
    meanSlopeDeg: 4.3,
    rockAbundancePct: null,
    medianGrainSizeMm: null,
    albedo: null,
    vegetationCoverPct: null,
    lithology: "clay-sedimentary",
    elevationM: 1140,
    surfacePressurePa: null,
    surfaceSolarIrradianceWm2: 195,
    ...envOverrides,
  }
  const provenanceMap = {
    elevationM: {
      status: "unverified",
      dataOrigin: "live-api-estimate",
      verificationState: "unverified",
      evidenceClassification: "measured",
      sourceTitle: "Open-Meteo Copernicus DEM GLO-90",
      sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
      datasetVersion: "GLO-90",
      provider: "Open-Meteo",
      unit: "m",
      spatialResolution: "90 m grid",
      isComparable: true,
    },
    meanSlopeDeg: {
      status: "unverified",
      dataOrigin: "computed-derivative",
      verificationState: "unverified",
      evidenceClassification: "derived",
      sourceTitle: "Copernicus DEM 5-point gradient (~445 m)",
      sourceUrl: "https://open-meteo.com/en/docs/elevation-api",
      unit: "deg",
      spatialResolution: "~445 m stencil",
      isComparable: true,
    },
    meanSurfaceTempC: {
      status: "unverified",
      dataOrigin: "live-api-estimate",
      verificationState: "unverified",
      evidenceClassification: "proxy",
      sourceTitle: "NASA POWER Climatology (MERRA-2 T2M)",
      sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/climatology/",
      datasetVersion: "v2.10.1",
      measurementPeriod: "2001-2025",
      unit: "°C",
      spatialResolution: "0.5° × 0.625°",
      isComparable: true,
    },
    lithology: {
      status: "unverified",
      dataOrigin: "live-api-estimate",
      verificationState: "unverified",
      evidenceClassification: "proxy",
      sourceTitle: "Macrostrat Geologic Map API v2",
      sourceUrl: "https://macrostrat.org/api/v2/mobile/map_query_v2",
      datasetVersion: "map_query_v2",
      unit: "categorical",
      spatialResolution: "1:250k–1:5M",
      isComparable: true,
    },
  }
  const candidate = {
    id,
    name,
    country: "Regional Scan",
    latitude: 37.55,
    longitude: 29.68,
    boundingBox: [37.3, 29.4, 37.8, 29.9],
    setting: "Hydromagnesite lacustrine shoreline cell",
    summary: "Deterministic fixture for Cloud Research Workspace tests",
    environment,
    provenanceMap,
    isVerified: false,
    noveltyTier: "live-grid-discovery",
  }
  const featureScores = COMPARISON_FEATURES.map((def) =>
    evaluateFeatureComparison(
      def,
      profile.weights[def.key] ?? 0,
      target.environment[def.key] ?? null,
      candidate.environment[def.key] ?? null,
      target.provenanceMap?.[def.key],
      candidate.provenanceMap?.[def.key]
    )
  )
  const sim = computeAnalogSimilarity(target, candidate, {
    id: profile.id,
    weights: profile.weights,
  })
  return {
    rank: 1,
    candidate,
    score: sim.score,
    scoreDisplay:
      sim.score !== null
        ? `${sim.score.toFixed(1)}% (Exploratory)`
        : "Insufficient data to rank reliably",
    coverage: sim.coverage,
    confidence: sim.confidence,
    isReliable: sim.isReliable,
    weightedDistance: sim.weightedDistance,
    missingFeatures: featureScores
      .filter((f) => f.status === "missing_data")
      .map((f) => f.key),
    incompatibleFeatures: [],
    featureScores,
    explanation: "Deterministic cloud workspace fixture.",
    warnings: [],
  }
}

function createSampleRecord(
  id = "cell_salda_cloud_1",
  name = "Salda Cloud Screening Cell #1",
  profile = GEOLOGICAL_RESEARCH_PROFILE,
  createdAt = "2026-11-15T01:00:00.000Z"
) {
  const candRes = buildFixtureCandidateResult(id, name, {}, profile)
  const intel = buildLiveCandidateIntelligence({
    candidateResult: candRes,
    target: JEZERO_TARGET,
    missionProfile: profile,
  })
  return {
    candRes,
    intel,
    record: createResearchAssessmentRecord({
      candidateResult: candRes,
      target: JEZERO_TARGET,
      missionProfile: profile,
      intelligence: intel,
      createdAt,
    }),
  }
}

test("1. Versioned SQL migration & zero service-role exposure audit", () => {
  const migrationSql = readFileSync(
    resolve(
      ROOT,
      "supabase/migrations/20261115000000_create_cloud_research_workspace.sql"
    ),
    "utf8"
  )

  // Verify all 4 normalized tables exist
  assert.ok(migrationSql.includes("CREATE TABLE IF NOT EXISTS public.research_records"))
  assert.ok(
    migrationSql.includes("CREATE TABLE IF NOT EXISTS public.research_assessment_revisions")
  )
  assert.ok(migrationSql.includes("CREATE TABLE IF NOT EXISTS public.research_tasks"))
  assert.ok(migrationSql.includes("CREATE TABLE IF NOT EXISTS public.research_notes"))

  // Verify ENABLE + FORCE ROW LEVEL SECURITY on all 4 tables
  assert.ok(migrationSql.includes("ALTER TABLE public.research_records ENABLE ROW LEVEL SECURITY"))
  assert.ok(migrationSql.includes("ALTER TABLE public.research_records FORCE ROW LEVEL SECURITY"))
  assert.ok(
    migrationSql.includes(
      "ALTER TABLE public.research_assessment_revisions ENABLE ROW LEVEL SECURITY"
    )
  )
  assert.ok(
    migrationSql.includes("ALTER TABLE public.research_tasks ENABLE ROW LEVEL SECURITY")
  )
  assert.ok(
    migrationSql.includes("ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY")
  )

  // Verify anonymous access is revoked and SELECT/INSERT/UPDATE/DELETE policies check auth.uid() = user_id
  assert.ok(migrationSql.includes("REVOKE ALL ON public.research_records FROM anon"))
  assert.ok(migrationSql.includes("FOR SELECT"))
  assert.ok(migrationSql.includes("FOR INSERT"))
  assert.ok(migrationSql.includes("FOR UPDATE"))
  assert.ok(migrationSql.includes("FOR DELETE"))
  assert.ok(migrationSql.includes("auth.uid() = user_id"))
  assert.ok(migrationSql.includes("prevent_research_revision_mutation"))
  assert.ok(migrationSql.includes("observation_status = 'recommended-not-completed'"))

  // Verify service-role guard blocks NEXT_PUBLIC_ service-role exposure
  assert.deepStrictEqual(assertNoPrivilegedServiceRoleExposure({}), { safe: true })
  assert.throws(
    () =>
      assertNoPrivilegedServiceRoleExposure({
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "secret",
      }),
    /Security violation/
  )
  const fakeServiceJwt = [
    Buffer.from('{"alg":"HS256"}').toString("base64url"),
    Buffer.from('{"role":"service_role"}').toString("base64url"),
    "sig",
  ].join(".")
  assert.throws(
    () =>
      assertNoPrivilegedServiceRoleExposure({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: fakeServiceJwt,
      }),
    /privileged service_role JWT/
  )

  const clientTs = readFileSync(resolve(ROOT, "src/utils/supabase/client.ts"), "utf8")
  assert.ok(!clientTs.includes("SERVICE_ROLE"))
})

test("2. Strict Row Level Security (SELECT, INSERT, UPDATE, DELETE): User A vs User B isolation & anonymous rejection", async () => {
  const store = new RlsEnforcedRelationalWorkspaceStore()
  const service = new CloudResearchWorkspaceService({ fallbackStore: store })

  const userA = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "researcher.a@nasa.example",
    authProvider: "supabase-auth",
  }
  const userB = {
    id: "22222222-2222-4222-8222-222222222222",
    email: "researcher.b@esa.example",
    authProvider: "supabase-auth",
  }

  const { record: rawRecA } = createSampleRecord()
  let recA = addUserResearchNote(rawRecA, {
    title: "User A private carbonate hypothesis",
    body: "Check hydromagnesite shoreline bands in ASTER TIR.",
    relatedFeature: "lithology",
  })
  recA = updateResearchTaskStatus(recA, recA.tasks[0].id, "evidence-review", {
    owner: "User A",
    notes: "Assigned to User A spectroscopy team",
  })

  // 1) Anonymous / unauthenticated user cannot SELECT, INSERT, UPDATE, or DELETE
  await assert.rejects(() => service.listRecords(null), (err) => {
    assert.ok(err instanceof RlsSecurityError)
    assert.strictEqual(err.statusCode, 401)
    return true
  })
  await assert.rejects(() => service.upsertRecord(null, recA), RlsSecurityError)
  await assert.rejects(
    () => service.deleteRecord(null, { contextKey: recA.contextKey }),
    RlsSecurityError
  )

  // 2) User A saves record in Cloud Workspace
  const savedA = await service.upsertRecord(userA, recA)
  assert.ok(savedA.records[recA.contextKey])
  assert.strictEqual(savedA.records[recA.contextKey].ownerUserId, userA.id)
  assert.strictEqual(savedA.records[recA.contextKey].notes.length, 1)

  const rowA = store.selectRecords(userA.id)[0]
  assert.ok(rowA)
  assert.strictEqual(rowA.user_id, userA.id)

  // 3) User B SELECT: cannot read User A's records, revisions, tasks, or notes
  const listB = await service.listRecords(userB)
  assert.deepStrictEqual(listB.records, {})
  assert.strictEqual(store.selectRecords(userB.id).length, 0)
  assert.strictEqual(store.selectRevisions(userB.id, rowA.id).length, 0)
  assert.strictEqual(store.selectTasks(userB.id, rowA.id).length, 0)
  assert.strictEqual(store.selectNotes(userB.id, rowA.id).length, 0)

  // 4) User B INSERT spoofing: cannot create a record claiming ownerUserId = userA.id
  await assert.rejects(
    () => service.upsertRecord(userB, { ...recA, ownerUserId: userA.id }),
    (err) => {
      assert.ok(err instanceof RlsSecurityError)
      assert.strictEqual(err.statusCode, 403)
      return true
    }
  )

  // User B low-level table INSERT spoofing: cannot insert revision, task, or note attached to User A's record UUID
  assert.throws(
    () =>
      store.insertRevisionRow(userB.id, {
        user_id: userB.id,
        research_record_uuid: rowA.id,
        record_id: recA.recordId,
        context_key: recA.contextKey,
        revision_number: 2,
        label: "Injected by B",
        snapshot_id: "snap-evil",
        content_digest: recA.snapshot.contentDigest,
        snapshot: recA.snapshot,
      }),
    RlsSecurityError
  )
  assert.throws(
    () =>
      store.upsertTaskRow(userB.id, {
        user_id: userB.id,
        research_record_uuid: rowA.id,
        record_id: recA.recordId,
        task_id: "evil-task",
        candidate_id: recA.candidateId,
        title: "Evil",
        scientific_rationale: "Evil",
        related_gap: "Evil",
        suggested_observation_method: "Evil",
        priority: "high",
      }),
    RlsSecurityError
  )
  assert.throws(
    () =>
      store.insertNoteRow(userB.id, {
        user_id: userB.id,
        research_record_uuid: rowA.id,
        record_id: recA.recordId,
        note_id: "evil-note",
        candidate_id: recA.candidateId,
        title: "Injected Note",
        body: "Injected by User B",
      }),
    RlsSecurityError
  )

  // 5) User B UPDATE: cannot modify User A's record row
  assert.throws(
    () =>
      store.updateRecordRow(userB.id, rowA.id, {
        candidate_name: "Hacked Name",
      }),
    RlsSecurityError
  )

  // 6) User B DELETE: cannot delete User A's record
  assert.throws(() => store.deleteRecordByUuid(userB.id, rowA.id), RlsSecurityError)
  await assert.rejects(
    () =>
      service.deleteRecord(userB, {
        contextKey: recA.contextKey,
        ownerUserId: userA.id,
      }),
    RlsSecurityError
  )

  // Verify User A's record is 100% intact after all User B attacks
  const checkA = await service.listRecords(userA)
  assert.ok(checkA.records[recA.contextKey])
  assert.strictEqual(
    checkA.records[recA.contextKey].notes[0].title,
    "User A private carbonate hypothesis"
  )
})

test("3. Immutable revisions, scientific integrity preservation, and 6-format exports", async () => {
  const store = new RlsEnforcedRelationalWorkspaceStore()
  const service = new CloudResearchWorkspaceService({ fallbackStore: store })
  const userA = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "researcher.a@nasa.example",
    authProvider: "supabase-auth",
  }

  const { candRes, intel, record: initialRec } = createSampleRecord()
  await service.upsertRecord(userA, initialRec)

  // Append Revision 2
  const withRev2 = appendAssessmentRevision({
    record: initialRec,
    candidateResult: candRes,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    revisionLabel: "Assessment B — Cloud Follow-Up Snapshot",
    createdAt: "2026-11-15T01:10:00.000Z",
  })
  const syncedRev2 = await service.upsertRecord(userA, withRev2)
  const storedRec = syncedRev2.records[initialRec.contextKey]
  assert.strictEqual(storedRec.revisionHistory.length, 2)
  assert.strictEqual(
    storedRec.revisionHistory[0].snapshotId,
    initialRec.snapshot.snapshotId
  )
  assert.strictEqual(
    storedRec.revisionHistory[0].snapshot.contentDigest,
    initialRec.snapshot.contentDigest
  )

  // Attempting to mutate an existing revision row in-place MUST throw ImmutableRevisionError
  const revRows = store.selectRevisions(userA.id)
  assert.strictEqual(revRows.length, 2)
  assert.throws(
    () => store.updateRevisionRow(userA.id, revRows[0].id, { label: "Mutated Label" }),
    ImmutableRevisionError
  )

  // Closing all tasks never upgrades candidate.isVerified or observationStatus
  let allClosed = storedRec
  for (const t of storedRec.tasks) {
    allClosed = updateResearchTaskStatus(allClosed, t.id, "closed")
  }
  const afterClose = await service.upsertRecord(userA, allClosed)
  const closedCloudRec = afterClose.records[initialRec.contextKey]
  assert.strictEqual(closedCloudRec.snapshot.isVerified, false)
  assert.strictEqual(closedCloudRec.snapshot.candidate.environment.albedo, null)
  assert.ok(
    closedCloudRec.tasks.every((t) => t.observationStatus === "recommended-not-completed")
  )

  // All 6 exports (PDF, 4 CSVs, Snapshot JSON) work cleanly on cloud-synced records
  const pdfBytes = generateScientificAssessmentPdf(closedCloudRec)
  assert.ok(Buffer.from(pdfBytes).toString("latin1").startsWith("%PDF-1.4"))
  assert.ok(generateCandidateSummaryCsv(closedCloudRec).includes(closedCloudRec.snapshot.snapshotId))
  assert.ok(
    generateScientificFeaturesCsv(closedCloudRec).includes(closedCloudRec.snapshot.snapshotId)
  )
  assert.ok(generateResearchTasksCsv(closedCloudRec).includes("recommended-not-completed"))
  assert.ok(
    generateProvenanceManifestCsv(closedCloudRec).includes(closedCloudRec.snapshot.snapshotId)
  )
  assert.ok(
    serializeResearchRecordJson(closedCloudRec).includes(closedCloudRec.snapshot.contentDigest)
  )
})

test("4. Safe localStorage import without duplicates and non-destructive offline conflict merging", async () => {
  const store = new RlsEnforcedRelationalWorkspaceStore()
  const service = new CloudResearchWorkspaceService({ fallbackStore: store })
  const userA = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "researcher.a@nasa.example",
    authProvider: "supabase-auth",
  }

  const { candRes, intel, record: rec1 } = createSampleRecord(
    "cell_import_1",
    "Import Cell #1",
    GEOLOGICAL_RESEARCH_PROFILE,
    "2026-11-15T01:00:00.000Z"
  )
  const { record: rec2 } = createSampleRecord(
    "cell_import_2",
    "Import Cell #2",
    ROVER_TESTING_PROFILE,
    "2026-11-15T01:05:00.000Z"
  )

  // Import batch of 2 localStorage records
  const firstImport = await service.importLocalRecordsBatch(userA, {
    [rec1.contextKey]: rec1,
    [rec2.contextKey]: rec2,
  })
  assert.strictEqual(Object.keys(firstImport.records).length, 2)
  assert.strictEqual(firstImport.importedCount, 2)

  // Re-importing the exact same localStorage records produces ZERO duplicate revisions/notes/tasks
  const secondImport = await service.importLocalRecordsBatch(userA, {
    [rec1.contextKey]: rec1,
    [rec2.contextKey]: rec2,
  })
  assert.strictEqual(Object.keys(secondImport.records).length, 2)
  assert.strictEqual(secondImport.records[rec1.contextKey].revisionHistory.length, 1)

  // Simulate offline conflict: Session 1 (online) and Session 2 (offline) both append Revision #2 with different timestamps/labels
  let onlineBranch = appendAssessmentRevision({
    record: rec1,
    candidateResult: candRes,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    revisionLabel: "Assessment B — Online Tab Revision",
    createdAt: "2026-11-15T01:20:00.000Z",
  })
  onlineBranch = addUserResearchNote(onlineBranch, {
    title: "Online Session Note",
    body: "Added while online in Session 1.",
    now: "2026-11-15T01:20:05.000Z",
  })

  let offlineBranch = appendAssessmentRevision({
    record: rec1,
    candidateResult: candRes,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    revisionLabel: "Assessment B — Offline Field Laptop Revision",
    createdAt: "2026-11-15T01:25:00.000Z",
  })
  offlineBranch = addUserResearchNote(offlineBranch, {
    title: "Offline Laptop Note",
    body: "Added while offline in Session 2.",
    now: "2026-11-15T01:25:05.000Z",
  })

  await service.upsertRecord(userA, onlineBranch)
  const conflictSync = await service.upsertRecord(userA, offlineBranch)

  assert.strictEqual(conflictSync.hadRevisionConflict, true)
  const mergedRec = conflictSync.records[rec1.contextKey]
  // Must preserve Revision 1 + Online Revision 2 + Offline Revision (re-indexed as Revision 3)
  assert.strictEqual(mergedRec.revisionHistory.length, 3)
  assert.strictEqual(mergedRec.notes.length, 2)
  assert.ok(mergedRec.notes.some((n) => n.title === "Online Session Note"))
  assert.ok(mergedRec.notes.some((n) => n.title === "Offline Laptop Note"))
})

test("5. Live two-session HTTP verification: Session A1 & Session A2 sync while User B is isolated", async (t) => {
  let probeOk = false
  try {
    const probe = await fetch("http://localhost:3000/api/research-workspace")
    probeOk = probe.ok
  } catch {
    probeOk = false
  }
  if (!probeOk) {
    t.skip("Local server on http://localhost:3000 is not running")
    return
  }

  const signupA = registerOrVerifyLocalCrewIdentity({
    email: "crew.session.alpha@terratwin.example",
    password: "TerraTwin_Alpha_Password_2026!",
    mode: "signup",
  })
  assert.strictEqual(signupA.ok, true)
  const loginA1 = registerOrVerifyLocalCrewIdentity({
    email: "crew.session.alpha@terratwin.example",
    password: "TerraTwin_Alpha_Password_2026!",
    mode: "login",
  })
  const loginA2 = registerOrVerifyLocalCrewIdentity({
    email: "crew.session.alpha@terratwin.example",
    password: "TerraTwin_Alpha_Password_2026!",
    mode: "login",
  })
  const badLoginA = registerOrVerifyLocalCrewIdentity({
    email: "crew.session.alpha@terratwin.example",
    password: "Wrong_Password!",
    mode: "login",
  })
  assert.strictEqual(loginA1.ok, true)
  assert.strictEqual(loginA2.ok, true)
  assert.strictEqual(badLoginA.ok, false)

  const signupB = registerOrVerifyLocalCrewIdentity({
    email: "crew.session.bravo@terratwin.example",
    password: "TerraTwin_Bravo_Password_2026!",
    mode: "signup",
  })
  assert.strictEqual(signupB.ok, true)

  const userA = loginA1.user
  const userB = signupB.user

  const cookieSessionA1 = `${VERIFIED_CREW_SESSION_COOKIE}=${signCrewSessionToken(userA)}`
  const cookieSessionA2 = `${VERIFIED_CREW_SESSION_COOKIE}=${signCrewSessionToken(loginA2.user)}`
  const cookieSessionB1 = `${VERIFIED_CREW_SESSION_COOKIE}=${signCrewSessionToken(userB)}`

  // Verify SSR /discover page renders authenticated header identity for Session A1 and Session B1
  const discoverPageA1 = await fetch("http://localhost:3000/discover", {
    headers: { cookie: cookieSessionA1 },
  })
  assert.strictEqual(discoverPageA1.status, 200)
  const htmlA1 = await discoverPageA1.text()
  assert.ok(htmlA1.includes(userA.email), "SSR /discover header must show User A email in Session A1")
  assert.ok(htmlA1.includes("Abort Session"), "SSR /discover header must show Abort Session button")

  const discoverPageB1 = await fetch("http://localhost:3000/discover", {
    headers: { cookie: cookieSessionB1 },
  })
  assert.strictEqual(discoverPageB1.status, 200)
  const htmlB1 = await discoverPageB1.text()
  assert.ok(htmlB1.includes(userB.email), "SSR /discover header must show User B email in Session B1")

  // Clean up any prior test contextKey for User A
  const { candRes, intel, record: baseRec } = createSampleRecord(
    "cell_http_sync_a",
    "HTTP Multi-Session Cell Alpha",
    GEOLOGICAL_RESEARCH_PROFILE,
    "2026-11-15T02:00:00.000Z"
  )
  await fetch(
    `http://localhost:3000/api/research-workspace?contextKey=${encodeURIComponent(baseRec.contextKey)}`,
    {
      method: "DELETE",
      headers: { cookie: cookieSessionA1 },
    }
  )

  // 1) Unauthenticated POST/DELETE must be rejected with HTTP 401
  const unauthPost = await fetch("http://localhost:3000/api/research-workspace", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "upsert", record: baseRec }),
  })
  assert.strictEqual(unauthPost.status, 401)

  // 2) Authenticated Session A1 creates snapshot + adds note + closes first task + appends Revision #2
  let recA1 = addUserResearchNote(baseRec, {
    title: "Session A1 Cloud Synced Note",
    body: "Verified across two independent authenticated sessions.",
    relatedFeature: "meanSlopeDeg",
    userSuppliedSourceUrl: "https://example.org/salda-analog-reference",
  })
  recA1 = updateResearchTaskStatus(recA1, recA1.tasks[0].id, "closed", {
    owner: "Commander Alpha",
    notes: "Closed in Session A1",
  })
  recA1 = appendAssessmentRevision({
    record: recA1,
    candidateResult: candRes,
    target: JEZERO_TARGET,
    missionProfile: GEOLOGICAL_RESEARCH_PROFILE,
    intelligence: intel,
    revisionLabel: "Assessment B — Session A1 Second Snapshot",
    createdAt: "2026-11-15T02:05:00.000Z",
  })

  const postA1 = await fetch("http://localhost:3000/api/research-workspace", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieSessionA1,
    },
    body: JSON.stringify({ action: "upsert", record: recA1 }),
  })
  assert.strictEqual(postA1.status, 200)

  // 3) Independent Authenticated Session A2 fetches workspace and sees exact synced record, revisions, task, and note
  const getA2 = await fetch("http://localhost:3000/api/research-workspace", {
    method: "GET",
    headers: { cookie: cookieSessionA2 },
  })
  assert.strictEqual(getA2.status, 200)
  const dataA2 = await getA2.json()
  assert.strictEqual(dataA2.authenticated, true)
  assert.strictEqual(dataA2.user.email, userA.email)
  const syncedInA2 = dataA2.records[baseRec.contextKey]
  assert.ok(syncedInA2, "Session A2 must receive record saved by Session A1")
  assert.strictEqual(syncedInA2.revisionHistory.length, 2)
  assert.strictEqual(syncedInA2.notes.length, 1)
  assert.strictEqual(syncedInA2.notes[0].title, "Session A1 Cloud Synced Note")
  assert.strictEqual(syncedInA2.tasks[0].status, "closed")
  assert.strictEqual(syncedInA2.tasks[0].observationStatus, "recommended-not-completed")
  assert.strictEqual(syncedInA2.snapshot.isVerified, false)

  // 4) Authenticated Session B1 (User B) cannot read, spoof-update, or delete User A's record
  const getB1 = await fetch("http://localhost:3000/api/research-workspace", {
    method: "GET",
    headers: { cookie: cookieSessionB1 },
  })
  assert.strictEqual(getB1.status, 200)
  const dataB1 = await getB1.json()
  assert.strictEqual(dataB1.records[baseRec.contextKey], undefined)

  const spoofUpdateB1 = await fetch("http://localhost:3000/api/research-workspace", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieSessionB1,
    },
    body: JSON.stringify({
      action: "upsert",
      record: { ...syncedInA2, ownerUserId: userA.id },
    }),
  })
  assert.strictEqual(spoofUpdateB1.status, 403)

  const spoofDeleteB1 = await fetch("http://localhost:3000/api/research-workspace", {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      cookie: cookieSessionB1,
    },
    body: JSON.stringify({
      contextKey: baseRec.contextKey,
      ownerUserId: userA.id,
    }),
  })
  assert.strictEqual(spoofDeleteB1.status, 403)

  // Clean up test record in Session A1
  const delA1 = await fetch(
    `http://localhost:3000/api/research-workspace?contextKey=${encodeURIComponent(baseRec.contextKey)}`,
    {
      method: "DELETE",
      headers: { cookie: cookieSessionA1 },
    }
  )
  assert.strictEqual(delA1.status, 200)
})
