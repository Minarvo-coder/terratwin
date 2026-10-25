import test from 'node:test'
import assert from 'node:assert'
import {
  linearSimilarity,
  logarithmicSimilarity,
  lithologySimilarity,
  computeFeatureScore,
  scoreCandidate,
  rankCandidates,
  MIN_RELIABLE_COVERAGE,
} from '../src/lib/terratwin/similarity.ts'
import { FEATURE_MAP, MISSION_PURPOSES } from '../src/lib/terratwin/features.ts'

test('1. Linear Similarity: Exact match returns 1.0', () => {
  assert.strictEqual(linearSimilarity(20, 20, 50), 1.0)
})

test('2. Linear Similarity: Out of tolerance returns 0.0 (clamped)', () => {
  assert.strictEqual(linearSimilarity(20, 80, 50), 0.0)
})

test('3. Linear Similarity: Partial difference scaled linearly', () => {
  assert.strictEqual(linearSimilarity(10, 20, 40), 0.75)
})

test('4. Logarithmic Similarity: Exact match returns 1.0', () => {
  assert.strictEqual(logarithmicSimilarity(0.5, 0.5, 2.0), 1.0)
})

test('5. Logarithmic Similarity: One order of magnitude difference with tolerance 2 returns 0.5', () => {
  // log10(1) = 0, log10(10) = 1. Diff = 1. 1 - 1/2 = 0.5
  assert.strictEqual(logarithmicSimilarity(1, 10, 2.0), 0.5)
})

test('6. Categorical Lithology Similarity: Exact match returns 1.0', () => {
  assert.strictEqual(lithologySimilarity('basaltic', 'basaltic'), 1.0)
})

test('7. Categorical Lithology Similarity: Same igneous family returns 0.5', () => {
  assert.strictEqual(lithologySimilarity('basaltic', 'volcanic-tephra'), 0.5)
})

test('8. Categorical Lithology Similarity: Different family returns 0.0', () => {
  assert.strictEqual(lithologySimilarity('basaltic', 'clay-sedimentary'), 0.0)
})

test('9. Missing feature: Never replaced with 0; returns status missing_data and similarity null', () => {
  const feat = FEATURE_MAP['meanSlopeDeg']
  const score = computeFeatureScore(feat, 3.0, 10, null)
  assert.strictEqual(score.similarity, null)
  assert.strictEqual(score.status, 'missing_data')
  assert.strictEqual(score.candidateValue, null)
})

test('10. Incompatible cross-body quantity: annualPrecipitationMm is rejected from direct planetary scoring', () => {
  const feat = FEATURE_MAP['annualPrecipitationMm']
  const score = computeFeatureScore(feat, 1.0, 0, 380)
  assert.strictEqual(score.similarity, null)
  assert.strictEqual(score.status, 'incompatible_quantities')
})

test('11. Incompatible units: returns status incompatible_units and similarity null', () => {
  const feat = FEATURE_MAP['meanSurfaceTempC']
  const score = computeFeatureScore(
    feat,
    1.0,
    -60,
    213,
    { status: 'verified', unit: '°C', isComparable: true },
    { status: 'verified', unit: 'K', isComparable: true }
  )
  assert.strictEqual(score.similarity, null)
  assert.strictEqual(score.status, 'incompatible_units')
})

test('12. Insufficient data: Candidate with < 40% coverage displays Insufficient data to rank reliably', () => {
  const target = {
    id: 'test-target',
    body: 'mars',
    name: 'Test Target',
    region: 'Test',
    summary: 'Test',
    environment: {
      meanSurfaceTempC: -60,
      diurnalTempRangeC: 80,
      annualPrecipitationMm: 0,
      meanSlopeDeg: 5,
      rockAbundancePct: 15,
      medianGrainSizeMm: 0.3,
      albedo: 0.2,
      vegetationCoverPct: 0,
      lithology: 'clay-sedimentary',
    },
  }

  // Candidate has only 1 feature present (albedo, weight 1.0 out of ~14.5)
  const sparseCandidate = {
    id: 'sparse-cand',
    name: 'Sparse Candidate',
    country: 'Nowhere',
    latitude: 0,
    longitude: 0,
    setting: 'Sparse',
    summary: 'Sparse',
    environment: {
      meanSurfaceTempC: null,
      diurnalTempRangeC: null,
      annualPrecipitationMm: null,
      meanSlopeDeg: null,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      albedo: 0.2, // only this
      vegetationCoverPct: null,
      lithology: null,
    },
  }

  const purpose = MISSION_PURPOSES[0] // rover-testing
  const scored = scoreCandidate(target, sparseCandidate, purpose)

  assert.strictEqual(scored.isReliable, false)
  assert.strictEqual(scored.score, null)
  assert.strictEqual(scored.scoreDisplay, 'Insufficient data to rank reliably')
  assert.strictEqual(scored.confidence, 'insufficient')
  assert.ok(scored.coverage < MIN_RELIABLE_COVERAGE)
})

test('13. Reliable Candidate: Coverage >= 40% produces deterministic score', () => {
  const target = {
    id: 'test-target',
    body: 'mars',
    name: 'Test Target',
    region: 'Test',
    summary: 'Test',
    environment: {
      meanSurfaceTempC: -60,
      diurnalTempRangeC: 80,
      annualPrecipitationMm: 0,
      meanSlopeDeg: 5,
      rockAbundancePct: 15,
      medianGrainSizeMm: 0.3,
      albedo: 0.2,
      vegetationCoverPct: 0,
      lithology: 'clay-sedimentary',
      elevationM: 0,
      surfaceSolarIrradianceWm2: 150,
    },
  }

  // Exact match candidate
  const matchCandidate = {
    id: 'exact-cand',
    name: 'Exact Match Candidate',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'Analog',
    summary: 'Analog',
    environment: {
      meanSurfaceTempC: -60,
      diurnalTempRangeC: 80,
      annualPrecipitationMm: 0,
      meanSlopeDeg: 5,
      rockAbundancePct: 15,
      medianGrainSizeMm: 0.3,
      albedo: 0.2,
      vegetationCoverPct: 0,
      lithology: 'clay-sedimentary',
      elevationM: 0,
      surfaceSolarIrradianceWm2: 150,
    },
  }

  const purpose = MISSION_PURPOSES[0]
  const scored = scoreCandidate(target, matchCandidate, purpose)

  assert.strictEqual(scored.isReliable, true)
  assert.strictEqual(scored.score, 100)
  assert.strictEqual(scored.scoreDisplay, '100.0%')
  assert.strictEqual(scored.confidence, 'high')
})

test('14. rankCandidates orders candidates descending by score and assigns 1-based ranks', () => {
  const target = {
    id: 'test-target',
    name: 'Target',
    body: 'mars',
    latitude: 0,
    longitude: 0,
    setting: 'Crater',
    summary: 'Target site',
    environment: {
      meanSurfaceTempC: -60,
      diurnalTempRangeC: 80,
      meanSlopeDeg: 5,
      rockAbundancePct: 15,
      medianGrainSizeMm: 0.3,
      albedo: 0.2,
      vegetationCoverPct: 0,
      lithology: 'clay-sedimentary',
      elevationM: 0,
      surfaceSolarIrradianceWm2: 150,
    },
  }

  const candHigh = {
    id: 'cand-high',
    name: 'High Match',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'A',
    summary: 'High match',
    environment: { ...target.environment },
  }

  const candLow = {
    id: 'cand-low',
    name: 'Low Match',
    country: 'Earth',
    latitude: 0,
    longitude: 0,
    setting: 'B',
    summary: 'Low match',
    environment: {
      ...target.environment,
      meanSurfaceTempC: 30, // Big temp difference
    },
  }

  const ranked = rankCandidates(target, [candLow, candHigh], MISSION_PURPOSES[0])
  assert.strictEqual(ranked.length, 2)
  assert.strictEqual(ranked[0].candidate.id, 'cand-high')
  assert.strictEqual(ranked[0].rank, 1)
  assert.strictEqual(ranked[1].candidate.id, 'cand-low')
  assert.strictEqual(ranked[1].rank, 2)
  assert.ok((ranked[0].score ?? 0) > (ranked[1].score ?? 0))
})
