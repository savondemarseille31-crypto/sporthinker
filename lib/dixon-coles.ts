// Dixon-Coles match probability engine for CdM 2026
// Reference: Dixon & Coles (1997) — score correlation model on Poisson marginals

const MAX_GOALS = 8
const RHO = -0.10          // low-score correlation (calibrated on intl football)
const LEAGUE_AVG = 1.35    // WC expected goals per team per match (historical avg)
const HOST_BOOST = 1.08    // crowd/atmosphere bonus for USA / CAN / MEX

// Multiplicateurs de phase de groupe
// J1 : équipes prudentes, adversaires inconnus → moins de buts
// J3 : au moins une équipe peut avoir besoin de marquer → légèrement plus ouvert
const MATCHDAY_MULT: Record<number, number> = { 1: 0.92, 2: 1.00, 3: 1.05 }

export type MatchContext = {
  matchday?: 1 | 2 | 3
}

// Precomputed factorials k=0..8
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320]

function poisson(k: number, lambda: number): number {
  return Math.exp(-lambda) * Math.pow(lambda, k) / FACT[k]
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

// Dixon-Coles τ correction — adjusts for under-represented 0-0/1-0/0-1/1-1 scores
function tau(h: number, a: number, lh: number, la: number): number {
  if (h === 0 && a === 0) return 1 - lh * la * RHO
  if (h === 1 && a === 0) return 1 + la * RHO
  if (h === 0 && a === 1) return 1 + lh * RHO
  if (h === 1 && a === 1) return 1 - RHO
  return 1
}

function buildScoreMatrix(lh: number, la: number): number[][] {
  const m: number[][] = []
  for (let h = 0; h <= MAX_GOALS; h++) {
    m[h] = []
    for (let a = 0; a <= MAX_GOALS; a++) {
      m[h][a] = poisson(h, lh) * poisson(a, la) * tau(h, a, lh, la)
    }
  }
  return m
}

export type MarketProbs = {
  homeWin: number
  draw:    number
  awayWin: number
  over25:  number
  under25: number
  over15:  number
  btts:    number
}

function deriveMarkets(m: number[][]): MarketProbs {
  let homeWin = 0, draw = 0, awayWin = 0, over25 = 0, over15 = 0, btts = 0

  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = m[h][a]
      if (h > a)       homeWin += p
      else if (h < a)  awayWin += p
      else             draw    += p
      if (h + a > 2)   over25  += p
      if (h + a > 1)   over15  += p
      if (h > 0 && a > 0) btts += p
    }
  }

  return { homeWin, draw, awayWin, over25, under25: 1 - over25, over15, btts }
}

export type MatchResult = {
  lh:           number
  la:           number
  markets:      MarketProbs
  blowoutRisk:  number   // asymmetry indicator — high value → one team dominant
  conf:         number   // data confidence [0,1] — modulates Kelly fraction
}

/**
 * Compute Dixon-Coles match probabilities from known λ values (live path).
 * Used when real xG data is available from API-Football during the tournament.
 */
export function computeMatchFromLambda(lh: number, la: number, conf = 1.0): MatchResult {
  const lhC = clamp(lh, 0.30, 3.50)
  const laC = clamp(la, 0.30, 3.50)
  const matrix     = buildScoreMatrix(lhC, laC)
  const markets    = deriveMarkets(matrix)
  const blowoutRisk = clamp(Math.abs(lhC - laC) / 2, 0, 1)
  return { lh: lhC, la: laC, markets, blowoutRisk, conf }
}

/**
 * Compute Dixon-Coles match probabilities from ELO ratings.
 *
 * @param eloH     ELO rating of home/nominal team
 * @param eloA     ELO rating of away/nominal team
 * @param isHostH  true if this team is a WC host (USA/CAN/MEX)
 * @param isHostA  true if this team is a WC host
 * @param conf     data confidence factor (default 0.85 for static ELO pre-tournament)
 */
export function computeMatch(
  eloH: number,
  eloA: number,
  isHostH: boolean,
  isHostA: boolean,
  conf = 0.85,
  context?: MatchContext,
): MatchResult {
  const diff  = eloH - eloA
  const ratio = Math.pow(10, diff / 400)
  const phaseMult = MATCHDAY_MULT[context?.matchday ?? 2] ?? 1.00
  let lh = LEAGUE_AVG * phaseMult * Math.sqrt(ratio)
  let la = LEAGUE_AVG * phaseMult / Math.sqrt(ratio)

  if (isHostH) lh *= HOST_BOOST
  if (isHostA) la *= HOST_BOOST

  lh = clamp(lh, 0.30, 3.50)
  la = clamp(la, 0.30, 3.50)

  const matrix  = buildScoreMatrix(lh, la)
  const markets = deriveMarkets(matrix)

  // Fix: was previously computed but never used downstream
  const blowoutRisk = clamp(Math.abs(lh - la) / 2, 0, 1)

  return { lh, la, markets, blowoutRisk, conf }
}
