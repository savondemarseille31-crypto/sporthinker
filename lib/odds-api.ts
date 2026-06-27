// The Odds API — cotes temps réel pour MLB, NBA, Tennis, CdM
// Quota : 500 req/mois gratuit. Cache agressif pour rester dans les limites.

const API_KEY = process.env.ODDS_API_KEY
const BASE    = 'https://api.the-odds-api.com/v4'

// Bookmakers prioritaires (décroissant) — préférence EU pour cotes décimales propres
const BK_PRIORITY = ['pinnacle', 'bet365', 'winamax_fr', 'draftkings', 'fanduel', 'betmgm', 'williamhill', 'bovada']

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
  draw?: number
  away?: number
  over?: number
  under?: number
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchOdds(sportKey: string, markets: string, revalidateSec: number): Promise<OddsEvent[]> {
  if (!API_KEY) return []
  try {
    const url = `${BASE}/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=eu,us,fr&markets=${markets}&oddsFormat=decimal`
    const res = await fetch(url, { next: { revalidate: revalidateSec } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// 6h cache — 4 req/jour par sport → ~120 req/mois
export function getMLBOdds()  { return fetchOdds('baseball_mlb',          'h2h,totals', 21600) }
export function getNBAOdds()  { return fetchOdds('basketball_nba',         'h2h,totals', 21600) }
export function getMLSOdds()  { return fetchOdds('soccer_usa_mls',         'h2h',        21600) }
export function getCdMOdds()  { return fetchOdds('soccer_fifa_world_cup',  'h2h',        86400) } // 24h

// ── Scores / résultats terminés — pour la solde foot (API-Football free n'a pas 2026) ──
export type OddsScore = {
  id: string
  completed: boolean
  home_team: string
  away_team: string
  scores: { name: string; score: string }[] | null
}

async function fetchScores(sportKey: string): Promise<OddsScore[]> {
  if (!API_KEY) return []
  try {
    const res = await fetch(`${BASE}/sports/${sportKey}/scores/?daysFrom=3&apiKey=${API_KEY}`, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

export function getCdMScores() { return fetchScores('soccer_fifa_world_cup') }
export function getMLSScores() { return fetchScores('soccer_usa_mls') }

// ── Player props CdM ─────────────────────────────────────────────────────────

type PropsOutcome  = { name: string; description: string; price: number; point?: number }
type PropsMarket   = { key: string; outcomes: PropsOutcome[] }
type PropsBookmaker = { key: string; markets: PropsMarket[] }
export type PlayerPropsResult = { id: string; bookmakers: PropsBookmaker[] }

// Liste des événements WC à venir (1h cache — 1 appel/h max)
export async function getCdMEventsList(): Promise<{ id: string; home_team: string; away_team: string }[]> {
  if (!API_KEY) return []
  try {
    const res = await fetch(
      `${BASE}/sports/soccer_fifa_world_cup/events?apiKey=${API_KEY}`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// Props joueurs pour un événement précis (24h cache — économise le quota)
export async function getCdMPlayerProps(eventId: string): Promise<PlayerPropsResult | null> {
  if (!API_KEY) return null
  try {
    const markets = 'player_goal_scorer_anytime,player_shots_on_target,player_cards,player_assists'
    const res = await fetch(
      `${BASE}/sports/soccer_fifa_world_cup/events/${eventId}/odds?apiKey=${API_KEY}&markets=${markets}&bookmakers=pinnacle&oddsFormat=decimal`,
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const PLAYER_MARKET_KEY: Record<string, string> = {
  'buteur':       'player_goal_scorer_anytime',
  'tirs-cadrés':  'player_shots_on_target',
  'tirs-tentés':  'player_shots',
  'carton-jaune': 'player_cards',
  'passeur':      'player_assists',
}

function normPlayer(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim()
}

function playerMatch(a: string, b: string): boolean {
  const na = normPlayer(a), nb = normPlayer(b)
  if (na === nb) return true
  const lastA = na.split(' ').at(-1)!, lastB = nb.split(' ').at(-1)!
  return lastA === lastB && lastA.length > 3
}

// Extrait la cote d'un joueur pour un marché donné depuis un résultat props
export function extractPlayerCote(result: PlayerPropsResult, playerName: string, marché: string): number | null {
  const bk = result.bookmakers[0]
  if (!bk) return null

  const marketKey = PLAYER_MARKET_KEY[marché]
  if (!marketKey) return null

  const market = bk.markets.find(m => m.key === marketKey)
  if (!market) return null

  // buteur / carton : outcome direct au nom du joueur
  if (marché === 'buteur' || marché === 'carton-jaune') {
    const o = market.outcomes.find(o => playerMatch(o.name, playerName))
    return o ? parseFloat(o.price.toFixed(2)) : null
  }

  // tirs / passes : chercher l'outcome "Over" du joueur
  const playerOutcomes = market.outcomes.filter(o => playerMatch(o.name, playerName))
  const over = playerOutcomes.find(o => o.description === 'Over' || o.description === 'Yes')
  return over ? parseFloat(over.price.toFixed(2)) : null
}

// Découvre les tournois ATP/WTA actifs (l'endpoint /sports ne consomme PAS de quota).
// S'adapte automatiquement à la saison : terre battue, gazon (Halle, Queen's), Wimbledon, US Open…
async function getActiveTennisKeys(): Promise<string[]> {
  if (!API_KEY) return []
  try {
    const res = await fetch(`${BASE}/sports/?apiKey=${API_KEY}`, { next: { revalidate: 43200 } })
    if (!res.ok) return []
    const sports: { key: string; active: boolean }[] = await res.json()
    return sports.filter(s => s.key.startsWith('tennis_') && s.active).map(s => s.key)
  } catch {
    return []
  }
}

// Tennis : cotes h2h de tous les tournois ATP/WTA actuellement en cours (12h cache)
export async function getTennisOdds(): Promise<OddsEvent[]> {
  const keys = await getActiveTennisKeys()
  if (!keys.length) return []
  const results = await Promise.all(keys.map(k => fetchOdds(k, 'h2h', 43200)))
  return results.flat()
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
  // Draw = le troisième outcome h2h (ni home ni away) — marché 3-way football
  const drawOdds  = h2h?.outcomes.find(o =>
    !match(o.name, event.home_team) && !match(o.name, event.away_team)
  )?.price
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
  } else if (type.includes('moneyline') || type.includes('1x2') || type.includes('vainqueur')) {
    if (homeOdds && match(pari, event.home_team)) cote = homeOdds
    else if (awayOdds && match(pari, event.away_team)) cote = awayOdds
    else cote = homeOdds ?? awayOdds ?? null
  } else if (type.includes('double chance')) {
    // 1X (dom ou nul) : 1 / (P_home + P_draw), 2X (ext ou nul) : 1 / (P_away + P_draw)
    const isHomeDouble = bet.includes('1x') || (bet.includes(norm(event.home_team)) && !bet.includes('2x'))
    if (isHomeDouble && homeOdds && drawOdds) {
      cote = parseFloat((1 / (1 / homeOdds + 1 / drawOdds)).toFixed(2))
    } else if (!isHomeDouble && awayOdds && drawOdds) {
      cote = parseFloat((1 / (1 / awayOdds + 1 / drawOdds)).toFixed(2))
    } else if (homeOdds && drawOdds) {
      cote = parseFloat((1 / (1 / homeOdds + 1 / drawOdds)).toFixed(2))
    }
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
    draw:  drawOdds  ? parseFloat(drawOdds.toFixed(2))  : undefined,
    away:  awayOdds  ? parseFloat(awayOdds.toFixed(2))  : undefined,
    over:  overOdds  ? parseFloat(overOdds.toFixed(2))  : undefined,
    under: underOdds ? parseFloat(underOdds.toFixed(2)) : undefined,
  }
}

// ── Enrichissement d'un signal ────────────────────────────────────────────────

import type { Signal } from './signals'
import type { DeviggdMarkets } from './football-signals'

// ── Extraction des probabilités déviggées depuis un OddsEvent ─────────────────
export function devigFromEvent(event: OddsEvent, home: string, away: string): DeviggdMarkets {
  const bk = event.bookmakers.find(b => b.key === 'pinnacle' || b.key === 'pinnacle_us')
    ?? event.bookmakers[0]
  if (!bk) return {}

  const h2h    = bk.markets.find(m => m.key === 'h2h')
  const totals = bk.markets.find(m => m.key === 'totals')
  const result: DeviggdMarkets = {}

  if (h2h) {
    const ho = h2h.outcomes.find(o => match(o.name, home))?.price
    const ao = h2h.outcomes.find(o => match(o.name, away))?.price
    const do_ = h2h.outcomes.find(o => !match(o.name, home) && !match(o.name, away))?.price
    if (ho && ao && do_) {
      const ph = 1/ho, pa = 1/ao, pd = 1/do_
      const t = ph + pa + pd
      result.homeWin = ph / t
      result.awayWin = pa / t
    }
  }

  if (totals) {
    const oo = totals.outcomes.find(o => o.name === 'Over')?.price
    const uo = totals.outcomes.find(o => o.name === 'Under')?.price
    if (oo && uo) {
      const po = 1/oo, pu = 1/uo
      const t = po + pu
      result.over25  = po / t
      result.under25 = pu / t
    }
  }

  return result
}

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
