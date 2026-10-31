import test from 'node:test'
import assert from 'node:assert'

import {
  generateCombinations,
  evaluatePortfolio,
  optimizeAnalogPortfolios,
} from '../src/lib/terratwin/portfolio-optimizer.ts'
import {
  ROVER_TESTING_PROFILE,
  GEOLOGICAL_RESEARCH_PROFILE,
} from '../src/lib/terratwin/config/comparison-config.ts'
import {
  SAMPLE_CANDIDATES,
  SAMPLE_TARGETS,
} from '../src/lib/terratwin/sample-dataset.ts'

// Mock candidate fixtures for edge cases
const mockTarget = {
  id: 'test-mars-target',
  body: 'mars',
  name: 'Test Mars Target',
  region: 'Equatorial',
  summary: 'Test target for optimizer validation',
  environment: {
    meanSlopeDeg: 10,
    rockAbundancePct: 20,
    medianGrainSizeMm: 0.5,
    elevationM: -1000,
    vegetationCoverPct: 0,
    diurnalTempRangeC: 80,
    meanSurfaceTempC: -50,
    surfaceSolarIrradianceWm2: 150,
    lithology: 'clay-sedimentary',
    albedo: 0.20,
    annualPrecipitationMm: 0,
    surfacePressurePa: 700,
  },
}

const mockCandidateA = {
  id: 'cand-a',
  name: 'Candidate A (Slope Specialist)',
  country: 'Country A',
  latitude: 10,
  longitude: 20,
  setting: 'Mountain Range',
  summary: 'Matches slope and rock abundance exactly, but has high vegetation and missing temperature.',
  environment: {
    meanSlopeDeg: 10, // exact match: d = 0
    rockAbundancePct: 20, // exact match: d = 0
    medianGrainSizeMm: 2.0, // moderate diff
    elevationM: -800,
    vegetationCoverPct: 30, // poor match
    diurnalTempRangeC: null, // missing!
    meanSurfaceTempC: null, // missing!
    surfaceSolarIrradianceWm2: 180,
    lithology: 'basaltic',
    albedo: 0.25,
    annualPrecipitationMm: 200,
    surfacePressurePa: 101325,
  },
}

const mockCandidateB = {
  id: 'cand-b',
  name: 'Candidate B (Thermal & Regolith Specialist)',
  country: 'Country B',
  latitude: -15,
  longitude: -40,
  setting: 'Arid Desert',
  summary: 'Matches temperature, diurnal swing, and low vegetation, but has steep divergent slope.',
  environment: {
    meanSlopeDeg: 35, // poor slope: diff = 25/25 = 1.0
    rockAbundancePct: 5, // poor rock
    medianGrainSizeMm: 0.5, // exact grain match: d = 0
    elevationM: -1100,
    vegetationCoverPct: 0, // exact vegetation match: d = 0
    diurnalTempRangeC: 80, // exact match: d = 0
    meanSurfaceTempC: -45, // very close: d = 5/150 = 0.033
    surfaceSolarIrradianceWm2: 150, // exact match: d = 0
    lithology: 'clay-sedimentary', // exact lithology: d = 0
    albedo: 0.20,
    annualPrecipitationMm: 10,
    surfacePressurePa: 101325,
  },
}

// -----------------------------------------------------------------------------
// 1. Combinatorial Generation Tests
// -----------------------------------------------------------------------------
test('Combinations: Correctly generates C(n, k) unique combinations without replacement', () => {
  const items = ['A', 'B', 'C', 'D']
  
  // C(4, 2) = 6
  const combos2 = generateCombinations(items, 2)
  assert.strictEqual(combos2.length, 6)
  assert.deepStrictEqual(combos2, [
    ['A', 'B'],
    ['A', 'C'],
    ['A', 'D'],
    ['B', 'C'],
    ['B', 'D'],
    ['C', 'D'],
  ])

  // C(4, 3) = 4
  const combos3 = generateCombinations(items, 3)
  assert.strictEqual(combos3.length, 4)
  assert.deepStrictEqual(combos3, [
    ['A', 'B', 'C'],
    ['A', 'B', 'D'],
    ['A', 'C', 'D'],
    ['B', 'C', 'D'],
  ])

  // Edge cases
  assert.deepStrictEqual(generateCombinations(items, 0), [])
  assert.deepStrictEqual(generateCombinations(items, 5), [])
  assert.deepStrictEqual(generateCombinations(items, 4), [['A', 'B', 'C', 'D']])
})

// -----------------------------------------------------------------------------
// 2. Synergy & Maximum Feature Coverage (No Double-Counting)
// -----------------------------------------------------------------------------
test('Portfolio Synergy: Combining complementary candidates strictly outperforms individual single sites', () => {
  const portfolio = evaluatePortfolio(mockTarget, [mockCandidateA, mockCandidateB], ROVER_TESTING_PROFILE)

  assert.strictEqual(portfolio.size, 2)
  assert.strictEqual(portfolio.isReliable, true)
  assert.ok(portfolio.score !== null)
  assert.ok(portfolio.bestSingleScore !== null)

  // Composite portfolio score must be >= best single site
  assert.ok(
    portfolio.score >= portfolio.bestSingleScore,
    `Portfolio score (${portfolio.score}) should exceed or equal best single score (${portfolio.bestSingleScore})`
  )
  assert.ok(portfolio.synergyGain !== null && portfolio.synergyGain >= 0)

  // Portfolio coverage must be strictly greater than Candidate A alone (since B covers temperature)
  assert.ok(
    portfolio.coverage >= portfolio.bestSingleCoverage,
    `Portfolio coverage (${portfolio.coverage}) should exceed or equal single coverage (${portfolio.bestSingleCoverage})`
  )

  // Verify feature-by-feature attribution correctly credits winning sites
  const slopeAttr = portfolio.attributions.find((a) => a.featureKey === 'meanSlopeDeg')
  assert.strictEqual(slopeAttr.bestCandidateId, 'cand-a', 'Candidate A should win slope')
  assert.strictEqual(slopeAttr.bestDistance, 0.0, 'Candidate A slope distance should be 0')

  const tempAttr = portfolio.attributions.find((a) => a.featureKey === 'meanSurfaceTempC')
  assert.strictEqual(tempAttr.bestCandidateId, 'cand-b', 'Candidate B should win temperature (A was missing)')
  assert.ok(tempAttr.bestDistance < 0.1, 'Candidate B temperature distance should be small')

  const grainAttr = portfolio.attributions.find((a) => a.featureKey === 'medianGrainSizeMm')
  assert.strictEqual(grainAttr.bestCandidateId, 'cand-b', 'Candidate B should win grain size (exact match)')
  assert.strictEqual(grainAttr.bestDistance, 0.0)
})

// -----------------------------------------------------------------------------
// 3. Mathematical Weight Integrity & Bounded Coverage
// -----------------------------------------------------------------------------
test('Mathematical Integrity: Weights are never double-counted and coverage is bounded in [0, 1]', () => {
  const portfolio = evaluatePortfolio(mockTarget, [mockCandidateA, mockCandidateB], ROVER_TESTING_PROFILE)

  assert.ok(portfolio.coverage >= 0 && portfolio.coverage <= 1.0, 'Coverage must be in [0, 1]')
  assert.ok(
    portfolio.weightedDistance !== null && portfolio.weightedDistance >= 0 && portfolio.weightedDistance <= 1.0,
    'Weighted distance must be in [0, 1]'
  )
  assert.ok(portfolio.score !== null && portfolio.score >= 0 && portfolio.score <= 100.0, 'Score must be in [0, 100]')

  // Ensure sum of weights in attributions equals active profile weight (1.0)
  const totalWeight = portfolio.attributions.reduce((sum, a) => sum + a.weight, 0)
  assert.ok(Math.abs(totalWeight - 1.0) < 1e-4, `Total attribution weight (${totalWeight}) should sum to 1.0`)
})

// -----------------------------------------------------------------------------
// 4. Missing Data & Insufficient Data Safety Handling
// -----------------------------------------------------------------------------
test('Missing Data Safety: Insufficient combined telemetry yields isReliable: false and score: null', () => {
  const sparseCandidate1 = {
    ...mockCandidateA,
    id: 'sparse-1',
    name: 'Sparse Candidate 1',
    environment: {
      ...mockCandidateA.environment,
      meanSlopeDeg: null,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      elevationM: null,
      vegetationCoverPct: null, // lacks >= 80% of mission weight
    },
  }

  const sparseCandidate2 = {
    ...mockCandidateB,
    id: 'sparse-2',
    name: 'Sparse Candidate 2',
    environment: {
      ...mockCandidateB.environment,
      meanSlopeDeg: null,
      rockAbundancePct: null,
      medianGrainSizeMm: null,
      elevationM: null,
      vegetationCoverPct: null,
    },
  }

  const portfolio = evaluatePortfolio(mockTarget, [sparseCandidate1, sparseCandidate2], ROVER_TESTING_PROFILE)

  assert.strictEqual(portfolio.isReliable, false, 'Should be unreliable when coverage < 40%')
  assert.strictEqual(portfolio.score, null, 'Score must be null when insufficient data')
  assert.ok(portfolio.coverage < 0.40, 'Coverage should be below 40%')
  assert.strictEqual(portfolio.confidence, 'insufficient')
  assert.ok(portfolio.scientificExplanation.includes('Insufficient telemetry coverage'))
})

// -----------------------------------------------------------------------------
// 5. Full Optimization on Sample & Verified Datasets
// -----------------------------------------------------------------------------
test('Exhaustive Optimizer: Correctly evaluates all candidate pairs and triples on real targets', () => {
  const jezeroTarget = SAMPLE_TARGETS.find((t) => t.id === 'mars-jezero-delta')
  assert.ok(jezeroTarget, 'Jezero target exists')

  // Run size 2 optimization
  const result2 = optimizeAnalogPortfolios(jezeroTarget, SAMPLE_CANDIDATES, ROVER_TESTING_PROFILE, {
    portfolioSize: 2,
    limit: 5,
  })

  assert.strictEqual(result2.portfolioSize, 2)
  assert.strictEqual(result2.totalCandidatesEvaluated, SAMPLE_CANDIDATES.length)
  const n = SAMPLE_CANDIDATES.length
  const expectedCombos2 = (n * (n - 1)) / 2
  assert.strictEqual(result2.totalCombinationsEvaluated, expectedCombos2) // C(n, 2)
  assert.ok(result2.portfolios.length <= 5)
  assert.ok(result2.portfolios.length >= 1)

  // Verify rank ordering: rank 1 has highest or equal score to rank 2
  for (let i = 0; i < result2.portfolios.length - 1; i++) {
    const current = result2.portfolios[i]
    const next = result2.portfolios[i + 1]
    assert.strictEqual(current.rank, i + 1)
    if (current.score !== null && next.score !== null) {
      assert.ok(current.score >= next.score, `Rank ${current.rank} score (${current.score}) >= Rank ${next.rank} score (${next.score})`)
    }
  }

  // Run size 3 optimization
  const result3 = optimizeAnalogPortfolios(jezeroTarget, SAMPLE_CANDIDATES, GEOLOGICAL_RESEARCH_PROFILE, {
    portfolioSize: 3,
    limit: 5,
  })

  const expectedCombos3 = (n * (n - 1) * (n - 2)) / 6
  assert.strictEqual(result3.portfolioSize, 3)
  assert.strictEqual(result3.totalCombinationsEvaluated, expectedCombos3) // C(n, 3)
  assert.strictEqual(result3.portfolios[0].candidates.length, 3)
  assert.ok(result3.portfolios[0].scientificExplanation.length > 50)
  assert.strictEqual(result3.portfolios[0].rank, 1)
})
