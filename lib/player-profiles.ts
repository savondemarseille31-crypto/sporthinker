// Profils joueurs ATP + WTA — auto-générés par scripts/compute-player-profiles.py
// Top 200 ATP + WTA · clay / grass / hard · Elo surface + WR 18m + forme 6 matchs
// Régénérer avant chaque Grand Chelem : python3 scripts/compute-player-profiles.py

import rawData from './player-profiles.json'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Surface = 'clay' | 'grass' | 'hard'

export type SurfaceStats = {
  elo: number
  wr18m: number | null      // win rate 18 derniers mois (null si < 5 matchs)
  matches18m: number
  form6: number | null      // victoires sur les 6 derniers matchs (null si < 3 matchs)
}

export type PlayerProfile = {
  rank: number
  clay: SurfaceStats
  grass: SurfaceStats
  hard: SurfaceStats
}

type DB = {
  atp: Record<string, PlayerProfile>
  wta: Record<string, PlayerProfile>
  _meta?: unknown
}

const db = rawData as unknown as DB

// ── Détection surface depuis nom de tournoi ESPN ──────────────────────────────

const CLAY_KEYWORDS = [
  'roland garros', 'french open',
  'monte', 'madrid', 'rome', 'italian', 'internazionali',
  'barcelona', 'hamburg', 'hamburg', 'geneva', 'lyon',
  'estoril', 'bucharest', 'istanbul', 'marrakech', 'cordoba',
  'buenos aires', 'rio', 'houston', 'munich', 'belgrade',
]

const GRASS_KEYWORDS = [
  "wimbledon", "queen's", "queens club", 'halle', 'eastbourne',
  'nottingham', 'hertogenbosch', "'s-hertogenbosch", 'bad homburg',
  'birmingham', 'grass',
]

export function detectSurface(tournament: string): Surface {
  const t = tournament.toLowerCase()
  if (CLAY_KEYWORDS.some(k => t.includes(k)))  return 'clay'
  if (GRASS_KEYWORDS.some(k => t.includes(k))) return 'grass'
  return 'hard'
}

// ── Lookup avec fallback ──────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

export function findProfile(
  espnName: string,
  tour: 'atp' | 'wta',
): PlayerProfile | null {
  const pool = db[tour]

  // Exact
  if (pool[espnName]) return pool[espnName]

  const normTarget = norm(espnName)
  const lastName   = espnName.split(' ').pop()?.toLowerCase() ?? ''

  // Normalisé complet
  for (const [key, p] of Object.entries(pool)) {
    if (norm(key) === normTarget) return p
  }

  // Nom inversé (joueurs chinois : ESPN met nom de famille en premier)
  const parts    = espnName.trim().split(' ')
  if (parts.length >= 2) {
    const reversed = [...parts.slice(1), parts[0]].join(' ')
    if (pool[reversed]) return pool[reversed]
    const normRev = norm(reversed)
    for (const [key, p] of Object.entries(pool)) {
      if (norm(key) === normRev) return p
    }
  }

  // Nom de famille seul (> 3 chars)
  if (lastName.length > 3) {
    for (const [key, p] of Object.entries(pool)) {
      if (key.split(' ').pop()?.toLowerCase() === lastName) return p
    }
  }

  return null
}

// ── Probabilité blendée ───────────────────────────────────────────────────────
// Sans H2H : P = 55% Elo_surface + 25% WR_surface_18m + 20% forme_surface_6m
// Avec H2H  : P = 55% Elo_surface + 25% WR_surface_18m + 10% forme + 10% H2H
//
// Règles :
//  - Elo est toujours disponible (jamais null)
//  - WR/form null → poids redistribué vers Elo
//  - H2H : seuil minimum 3 matchs sur surface, sinon ignoré

export function blendedWinProb(
  pA: PlayerProfile,
  pB: PlayerProfile,
  surface: Surface,
  h2hProb: number | null = null,   // P(A bat B) selon H2H surface — null = pas de données
): number {
  const sA = pA[surface]
  const sB = pB[surface]

  // Composante 1 : Elo surface (toujours dispo)
  const eloProb = 1 / (1 + Math.pow(10, (sB.elo - sA.elo) / 400))

  // Composante 2 : WR 18 mois surface
  let wrProb: number | null = null
  if (sA.wr18m !== null && sB.wr18m !== null && sA.wr18m + sB.wr18m > 0) {
    wrProb = sA.wr18m / (sA.wr18m + sB.wr18m)
  }

  // Composante 3 : forme (last 6 matchs surface-spécifique)
  let formProb: number | null = null
  if (sA.form6 !== null && sB.form6 !== null) {
    const fA = sA.form6 / 6
    const fB = sB.form6 / 6
    if (fA + fB > 0) formProb = fA / (fA + fB)
  }

  // Poids cibles
  const hasH2H  = h2hProb !== null
  const wElo    = 0.55
  const wWR     = wrProb   !== null ? 0.25 : 0
  const wForm   = formProb !== null ? (hasH2H ? 0.10 : 0.20) : 0
  const wH2H    = hasH2H && formProb !== null ? 0.10 : (hasH2H ? 0.20 : 0)

  const total = wElo + wWR + wForm + wH2H

  const prob = (
    wElo  * eloProb            +
    wWR   * (wrProb   ?? 0)    +
    wForm * (formProb ?? 0)    +
    wH2H  * (h2hProb  ?? 0)
  ) / total

  return Math.max(0.01, Math.min(0.99, prob))
}
