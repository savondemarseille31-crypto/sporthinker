// The Odds API — cotes temps réel pour MLB, NBA, Tennis, CdM
// Quota : 500 req/mois gratuit. Cache agressif pour rester dans les limites.

const API_KEY = process.env.ODDS_API_KEY
const BASE    = 'https://api.the-odds-api.com/v4'

// Bookmakers prioritaires (décroissant) — préférence EU pour cotes décimales propres
const BK_PRIORITY = ['pinnacle', 'bet365', 'unibet', 'draftkings', 'fanduel', 'betmgm', 'williamhill', 'bovada']

// ── Types ────────────────────────────────────────────────────────────────────

export type OddsOutcome  = { name: string; price: number; point?: number }
export type OddsMarket   = { key: 'h2h' | 'totals' | 'spreads'; outcomes: OddsOutcome[] }
export type OddsBookmaker = { key: string; title: string; markets: OddsMarket[] }

export type OddsEvent = {
  id: string
  sport_key: string
  home_team: string
  away_team: string
  commence_time: string
  bookmakers: OddsBookmaker[]
}

export type RealOdds = {
  cote: number       // cote décimale pour CE pari spécifique
  bookmaker: string  // source
  ligne?: number     // ligne réelle pour OVER/UNDER (ex: 7.0, 8.5)
  home?: number
  away?: number
  over?: number
  under?: number
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchOdds(sportKey: string, markets: string, revalidateSec: number): Promise<OddsEvent[]> {
  if (!API_KEY) return []
  try {
    const url = `${BASE}/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=eu,us&markets=${markets}&oddsFormat=decimal`
    const res = await fetch(url, { next: { revalidate: revalidateSec } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// 6h cache — 4 req/jour par sport → ~120 req/mois
export function getMLBOdds()  { return fetchOdds('baseball_mlb',     'h2h,totals', 21600) }
export function getNBAOdds()  { return fetchOdds('basketball_nba',   'h2h',        21600) }
export function getCdMOdds()  { return fetchOdds('soccer_fifa_world_cup', 'h2h',   86400) } // 24h

// Tennis : Roland Garros ATP + WTA (12h cache → ~60 req/mois pour les deux)
export async function getTennisOdds(): Promise<OddsEvent[]> {
  const [atp, wta] = await Promise.all([
    fetchOdds('tennis_atp_french_open', 'h2h', 43200),
    fetchOdds('tennis_wta_french_open', 'h2h', 43200),
  ])
  return [...atp, ...wta]
}

// ── Matching ─────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function match(a: string, b: string): boolean {
  const na = norm(a), nb = norm(b)
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  // Dernier mot (nom de ville / nom de famille)
  const la = na.split(' ').pop()!, lb = nb.split(' ').pop()!
  return la === lb && la.length > 3
}

export function findEvent(events: OddsEvent[], team1: string, team2: string): OddsEvent | null {
  return events.find(e =>
    (match(e.home_team, team1) && match(e.away_team, team2)) ||
    (match(e.home_team, team2) && match(e.away_team, team1))
  ) ?? null
}

function bestBookmaker(event: OddsEvent): OddsBookmaker | null {
  for (const key of BK_PRIORITY) {
    const bk = event.bookmakers.find(b => b.key === key)
    if (bk?.markets.length) return bk
  }
  return event.bookmakers[0] ?? null
}

// ── Extraction des cotes ─────────────────────────────────────────────────────

export function extractRealOdds(event: OddsEvent, typePari: string, pari: string): RealOdds | null {
  const bk = bestBookmaker(event)
  if (!bk) return null

  const h2h    = bk.markets.find(m => m.key === 'h2h')
  const totals = bk.markets.find(m => m.key === 'totals')

  const homeOdds  = h2h?.outcomes.find(o => match(o.name, event.home_team))?.price
  const awayOdds  = h2h?.outcomes.find(o => match(o.name, event.away_team))?.price
  const overOut   = totals?.outcomes.find(o => o.name === 'Over')
  const underOut  = totals?.outcomes.find(o => o.name === 'Under')
  const overOdds  = overOut?.price
  const underOdds = underOut?.price
  // La ligne (point) est identique pour Over et Under — on la récupère depuis l'un ou l'autre
  const ligne = overOut?.point ?? underOut?.point

  const type = typePari.toLowerCase()
  const bet  = pari.toLowerCase()

  let cote: number | null = null
  let ligneReelle: number | undefined

  if (type.includes('under') || bet.includes('under')) {
    cote = underOdds ?? null
    ligneReelle = ligne
  } else if (type.includes('over') || bet.includes('over')) {
    cote = overOdds ?? null
    ligneReelle = ligne
  } else if (type.includes('moneyline') || type.includes('1x2')) {
    if (homeOdds && match(pari, event.home_team)) cote = homeOdds
    else if (awayOdds && match(pari, event.away_team)) cote = awayOdds
    else cote = homeOdds ?? awayOdds ?? null
  } else if (type.includes('double chance')) {
    if (homeOdds && awayOdds) cote = parseFloat(((homeOdds + awayOdds) / 2 * 0.85).toFixed(2))
  } else if (type.includes('first 5') || type.includes('f5')) {
    if (homeOdds && match(pari, event.home_team)) cote = homeOdds
    else if (awayOdds && match(pari, event.away_team)) cote = awayOdds
    else cote = homeOdds ?? awayOdds ?? null
  } else if (type.includes('btts') || bet.includes('both teams')) {
    cote = null
  } else {
    cote = homeOdds ?? awayOdds ?? null
  }

  if (!cote) return null

  return {
    cote:      parseFloat(cote.toFixed(2)),
    bookmaker: bk.title,
    ligne:     ligneReelle,
    home:  homeOdds  ? parseFloat(homeOdds.toFixed(2))  : undefined,
    away:  awayOdds  ? parseFloat(awayOdds.toFixed(2))  : undefined,
    over:  overOdds  ? parseFloat(overOdds.toFixed(2))  : undefined,
    under: underOdds ? parseFloat(underOdds.toFixed(2)) : undefined,
  }
}

// ── Enrichissement d'un signal ────────────────────────────────────────────────

import type { Signal } from './signals'

export function enrichWithRealOdds(
  signal: Signal,
  mlbEvents:    OddsEvent[],
  nbaEvents:    OddsEvent[],
  tennisEvents: OddsEvent[],
  cdmEvents:    OddsEvent[],
): Signal {
  const eventsMap: Record<string, OddsEvent[]> = {
    MLB:    mlbEvents,
    NBA:    nbaEvents,
    Tennis: tennisEvents,
    CdM:    cdmEvents,
  }
  const events = eventsMap[signal.sport] ?? []
  if (!events.length) return signal

  const parts = signal.match.split(' vs ')
  if (parts.length < 2) return signal
  const [team1, team2] = parts.map(p => p.trim())

  const event = findEvent(events, team1, team2)
  if (!event) return signal

  const realOdds = extractRealOdds(event, signal.typePari, signal.pari)
  if (!realOdds) return signal

  // Si une ligne réelle est disponible (OVER/UNDER), on remplace l'estimation "~X.X"
  let pari = signal.pari
  if (realOdds.ligne != null) {
    const type = signal.typePari.toLowerCase()
    if (type.includes('under') || signal.pari.toLowerCase().includes('under')) {
      pari = `UNDER ${realOdds.ligne} points (Pinnacle)`
    } else if (type.includes('over') || signal.pari.toLowerCase().includes('over')) {
      pari = `OVER ${realOdds.ligne} points (Pinnacle)`
    }
  }

  return { ...signal, pari }
}
