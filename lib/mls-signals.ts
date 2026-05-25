import type { Signal, SignalForce } from './signals'

const API_KEY  = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'
const MLS_LEAGUE  = 253
const MLS_SEASON  = 2026

// Avantage domicile historique MLS (~46% win rate à domicile vs 33% baseline)
const MLS_HOME_BOOST = 0.06

// ── Types ─────────────────────────────────────────────────────────────────────

export type MLSFixture = {
  fixture: {
    id: number
    date: string
    venue: { name: string; city: string }
    status: { short: string; elapsed: number | null }
  }
  teams: {
    home: { id: number; name: string; winner: boolean | null }
    away: { id: number; name: string; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
}

export type StandingEntry = {
  team: { id: number; name: string }
  points: number
  goalsDiff: number
  conference: string
  form: string   // ex: "WLWDD" — 5 derniers matchs fournis par l'API
  all:  { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }
}

type TeamMetrics = {
  id: number
  name: string
  played: number
  winRate: number
  homeWinRate: number
  awayWinRate: number
  formRate: number   // ratio W sur les 5 derniers matchs (0–1)
  formStr: string    // ex: "WLWDD" pour affichage
  goalsForPG: number
  goalsAgainstPG: number
  conference: string
  points: number
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, ttl = 3600): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'x-apisports-key': API_KEY },
      next: { revalidate: ttl },
    })
    const json = await res.json()
    return (json.response ?? []) as T
  } catch {
    return [] as unknown as T
  }
}

export async function getMLSFixturesByDate(date: string): Promise<MLSFixture[]> {
  return apiFetch(`/fixtures?date=${date}&league=${MLS_LEAGUE}&season=${MLS_SEASON}`, 300)
}

export async function getMLSStandings(): Promise<StandingEntry[]> {
  type Raw = { league: { standings: RawEntry[][] } }[]
  type RawEntry = Omit<StandingEntry, 'conference'>
  const raw = await apiFetch<Raw>(`/standings?league=${MLS_LEAGUE}&season=${MLS_SEASON}`, 3600)
  if (!raw?.[0]) return []
  const out: StandingEntry[] = []
  const groups = raw[0].league.standings
  for (let i = 0; i < groups.length; i++) {
    const conf = i === 0 ? 'Eastern' : 'Western'
    for (const e of groups[i]) out.push({ ...e, conference: conf })
  }
  return out
}

// ── Métriques équipe ───────────────────────────────────────────────────────────

function parseFormRate(form: string): number {
  if (!form) return 0.40
  const chars = form.toUpperCase().split('')
  const wins  = chars.filter(c => c === 'W').length
  return chars.length > 0 ? wins / chars.length : 0.40
}

function toMetrics(s: StandingEntry): TeamMetrics {
  const safe = (n: number, d: number) => d > 0 ? n / d : 0.33
  return {
    id:             s.team.id,
    name:           s.team.name,
    played:         s.all.played,
    winRate:        safe(s.all.win,  s.all.played),
    homeWinRate:    safe(s.home.win, s.home.played),
    awayWinRate:    safe(s.away.win, s.away.played),
    formRate:       parseFormRate(s.form ?? ''),
    formStr:        s.form ?? '',
    goalsForPG:     safe(s.all.goals.for,     s.all.played),
    goalsAgainstPG: safe(s.all.goals.against, s.all.played),
    conference:     s.conference,
    points:         s.points,
  }
}

// ── Probabilité blendée ────────────────────────────────────────────────────────
// P_contextuel : home_wr_dom vs away_wr_ext  → capture l'avantage terrain (55%)
// P_global     : win_rate global              → lissage faible échantillon (25%)
// P_forme      : ratio W sur 5 derniers matchs → momentum récent (20%)
// + boost avantage domicile MLS fixe

function blendedProb(home: TeamMetrics, away: TeamMetrics): number {
  const hCtx = Math.max(0.05, home.homeWinRate)
  const aCtx = Math.max(0.05, away.awayWinRate)
  const pCtx = hCtx / (hCtx + aCtx)

  const hGlob = Math.max(0.05, home.winRate)
  const aGlob = Math.max(0.05, away.winRate)
  const pGlob = hGlob / (hGlob + aGlob)

  const hForm = Math.max(0.05, home.formRate)
  const aForm = Math.max(0.05, away.formRate)
  const pForm = hForm / (hForm + aForm)

  const pBlend = 0.55 * pCtx + 0.25 * pGlob + 0.20 * pForm

  const boost = MLS_HOME_BOOST * (1 - Math.abs(pBlend - 0.50) * 2)
  return Math.max(0.10, Math.min(0.90, pBlend + boost))
}

// ── Emoji par ville ────────────────────────────────────────────────────────────

export function teamEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('miami'))      return '🌊'
  if (n.includes('los angeles') || n.includes('lafc') || n.includes('galaxy')) return '🌴'
  if (n.includes('new york') || n.includes('nycfc') || n.includes('red bull')) return '🗽'
  if (n.includes('seattle'))    return '🧭'
  if (n.includes('portland'))   return '🌹'
  if (n.includes('atlanta'))    return '🪓'
  if (n.includes('toronto'))    return '🍁'
  if (n.includes('montreal') || n.includes('cf montréal')) return '⚜️'
  if (n.includes('vancouver'))  return '🍁'
  if (n.includes('chicago'))    return '💨'
  if (n.includes('houston'))    return '🚀'
  if (n.includes('dallas') || n.includes('fc dallas')) return '⭐'
  if (n.includes('nashville'))  return '🎸'
  if (n.includes('austin'))     return '🤠'
  if (n.includes('charlotte'))  return '👑'
  if (n.includes('cincinnati') || n.includes('fc cincinnati')) return '🔴'
  if (n.includes('columbus'))   return '⚫'
  if (n.includes('orlando'))    return '🏰'
  if (n.includes('philadelphia') || n.includes('union')) return '🔔'
  if (n.includes('washington') || n.includes('dc united')) return '🏛️'
  if (n.includes('minneapolis') || n.includes('minnesota')) return '❄️'
  if (n.includes('salt lake') || n.includes('real salt')) return '🏔️'
  if (n.includes('san jose'))   return '⚡'
  if (n.includes('san diego'))  return '🏖️'
  if (n.includes('colorado') || n.includes('rapids')) return '⛰️'
  if (n.includes('st. louis') || n.includes('saint louis')) return '🌉'
  if (n.includes('new england') || n.includes('revolution')) return '🦅'
  return '⚽'
}

// ── Génération signaux ─────────────────────────────────────────────────────────

export function generateMLSSignal(
  fixture: MLSFixture,
  homeMetrics: TeamMetrics,
  awayMetrics: TeamMetrics,
): Signal | null {
  if (homeMetrics.played < 3 || awayMetrics.played < 3) return null

  const p = blendedProb(homeMetrics, awayMetrics)
  const homeName = fixture.teams.home.name
  const awayName  = fixture.teams.away.name
  const matchStr  = `${homeName} vs ${awayName}`
  const coteMin   = (1 / p).toFixed(2)
  const coteMinAway = (1 / (1 - p)).toFixed(2)

  const date  = fixture.fixture.date.split('T')[0]
  const heure = new Date(fixture.fixture.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })

  const homeEmoji = teamEmoji(homeName)
  const awayEmoji  = teamEmoji(awayName)

  const avgGoals = homeMetrics.goalsForPG + awayMetrics.goalsForPG

  // ── CAS 1 : Victoire domicile ────────────────────────────────────────────
  if (p >= 0.63) {
    const force: SignalForce = p >= 0.70 ? 'fort' : 'modéré'
    return {
      id: `mls-${fixture.fixture.id}-home`,
      sport: 'MLS',
      match: matchStr,
      flagDom: homeEmoji,
      flagExt: awayEmoji,
      date, heure, force,
      typePari: 'Moneyline',
      pari: `Victoire ${homeName}`,
      raisonnement: `${homeName} domine à domicile (${Math.round(homeMetrics.homeWinRate * 100)}% win rate) face à ${awayName} moins performant à l'extérieur (${Math.round(awayMetrics.awayWinRate * 100)}%). P(dom) estimée à ${Math.round(p * 100)}% → cote minimale value : ${coteMin}.`,
      stats: [
        { label: `${homeName} dom%`,  val: `${Math.round(homeMetrics.homeWinRate * 100)}%`,  highlight: true },
        { label: `${awayName} ext%`,  val: `${Math.round(awayMetrics.awayWinRate * 100)}%` },
        { label: 'Forme dom. (5J)',    val: homeMetrics.formStr || '—',                       highlight: homeMetrics.formRate >= 0.60 },
        { label: 'Cote min. value',    val: `≥ ${coteMin}`,                                  highlight: true },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ── CAS 2 : Victoire extérieur ───────────────────────────────────────────
  if (p <= 0.37) {
    const pAway = 1 - p
    const force: SignalForce = pAway >= 0.70 ? 'fort' : 'modéré'
    return {
      id: `mls-${fixture.fixture.id}-away`,
      sport: 'MLS',
      match: matchStr,
      flagDom: homeEmoji,
      flagExt: awayEmoji,
      date, heure, force,
      typePari: 'Moneyline',
      pari: `Victoire ${awayName}`,
      raisonnement: `${awayName} en grande forme à l'extérieur (${Math.round(awayMetrics.awayWinRate * 100)}% win rate ext.) face à un ${homeName} fragile à domicile (${Math.round(homeMetrics.homeWinRate * 100)}%). P(ext.) estimée à ${Math.round(pAway * 100)}% → cote minimale value : ${coteMinAway}.`,
      stats: [
        { label: `${awayName} ext%`,  val: `${Math.round(awayMetrics.awayWinRate * 100)}%`,  highlight: true },
        { label: `${homeName} dom%`,  val: `${Math.round(homeMetrics.homeWinRate * 100)}%` },
        { label: 'Forme ext. (5J)',    val: awayMetrics.formStr || '—',                       highlight: awayMetrics.formRate >= 0.60 },
        { label: 'Cote min. value',    val: `≥ ${coteMinAway}`,                               highlight: true },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ── CAS 3 : Over 2.5 (match équilibré, deux attaques prolifiques) ────────
  if (avgGoals >= 2.8) {
    const force: SignalForce = avgGoals >= 3.2 ? 'fort' : 'modéré'
    return {
      id: `mls-${fixture.fixture.id}-over`,
      sport: 'MLS',
      match: matchStr,
      flagDom: homeEmoji,
      flagExt: awayEmoji,
      date, heure, force,
      typePari: 'Over (Total buts)',
      pari: 'OVER 2.5 buts',
      raisonnement: `Match équilibré (P(dom) ${Math.round(p * 100)}%) mais deux attaques prolifiques : ${homeName} marque ${homeMetrics.goalsForPG.toFixed(1)} buts/match, ${awayName} ${awayMetrics.goalsForPG.toFixed(1)}/match. Total attendu : ~${avgGoals.toFixed(1)} buts.`,
      stats: [
        { label: `${homeName} buts/match`,  val: homeMetrics.goalsForPG.toFixed(1),  highlight: true },
        { label: `${awayName} buts/match`,  val: awayMetrics.goalsForPG.toFixed(1),  highlight: true },
        { label: 'Total attendu',            val: `~${avgGoals.toFixed(1)}` },
        { label: 'P(dom)',                   val: `${Math.round(p * 100)}%` },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ── CAS 4 : Under 2.5 (deux défenses solides) ───────────────────────────
  if (avgGoals <= 2.0) {
    return {
      id: `mls-${fixture.fixture.id}-under`,
      sport: 'MLS',
      match: matchStr,
      flagDom: homeEmoji,
      flagExt: awayEmoji,
      date, heure,
      force: 'modéré',
      typePari: 'Under (Total buts)',
      pari: 'UNDER 2.5 buts',
      raisonnement: `Deux défenses solides : ${homeName} concède ${homeMetrics.goalsAgainstPG.toFixed(1)} buts/match, ${awayName} ${awayMetrics.goalsAgainstPG.toFixed(1)}/match. Total attendu : ~${avgGoals.toFixed(1)} buts.`,
      stats: [
        { label: `${homeName} conc./match`,  val: homeMetrics.goalsAgainstPG.toFixed(1),  highlight: true },
        { label: `${awayName} conc./match`,  val: awayMetrics.goalsAgainstPG.toFixed(1),  highlight: true },
        { label: 'Total attendu',             val: `~${avgGoals.toFixed(1)}` },
        { label: 'P(dom)',                    val: `${Math.round(p * 100)}%` },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  return null
}

// ── Point d'entrée principal ───────────────────────────────────────────────────

export async function generateMLSSignalsForToday(): Promise<Signal[]> {
  const today = new Date().toISOString().split('T')[0]

  const [fixtures, standings] = await Promise.all([
    getMLSFixturesByDate(today),
    getMLSStandings(),
  ])

  const upcoming = fixtures.filter(f =>
    f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD'
  )
  if (!upcoming.length || !standings.length) return []

  const standingMap = new Map(standings.map(s => [s.team.id, toMetrics(s)]))
  const signals: Signal[] = []

  for (const f of upcoming) {
    const home = standingMap.get(f.teams.home.id)
    const away  = standingMap.get(f.teams.away.id)
    if (!home || !away) continue
    const sig = generateMLSSignal(f, home, away)
    if (sig) signals.push(sig)
  }

  return signals.sort((a, b) => {
    const order: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
    return order[a.force] - order[b.force]
  })
}
