import type { Signal, SignalForce } from './signals'
import type { MLBGame } from './mlb-api'
import { getPitcherSeasonStats } from './mlb-api'

const BASE = 'https://statsapi.mlb.com/api/v1'

// ── Constantes ligue ──────────────────────────────────────────────────────────
export const LEAGUE_RUNS_PER_GAME = 4.50
export const LEAGUE_FIP           = 4.20
export const LEAGUE_wOBA          = 0.315
const FIP_CONSTANT                = 3.10
const DEFAULT_STARTER_IP          = 5.5   // moyenne MLB 2025

// ── Park factors par team ID (propriétaire du stade) ──────────────────────────
// >1 = hitter-friendly, <1 = pitcher-friendly. Source : Statcast 2024-2025 avg.
export const PARK_FACTOR: Record<number, number> = {
  // AL East
  110: 0.99, // BAL — Camden Yards
  111: 0.97, // BOS — Fenway Park
  147: 1.00, // NYY — Yankee Stadium
  139: 0.96, // TB  — Tropicana Field
  141: 0.99, // TOR — Rogers Centre
  // AL Central
  145: 1.02, // CWS — Guaranteed Rate Field
  114: 0.99, // CLE — Progressive Field
  116: 0.99, // DET — Comerica Park
  118: 1.00, // KC  — Kauffman Stadium
  142: 1.01, // MIN — Target Field
  // AL West
  117: 1.00, // HOU — Minute Maid Park
  108: 1.03, // LAA — Angel Stadium
  133: 0.98, // OAK/LV
  136: 0.98, // SEA — T-Mobile Park
  140: 1.02, // TEX — Globe Life Field
  // NL East
  144: 1.01, // ATL — Truist Park
  146: 0.97, // MIA — loanDepot park
  121: 1.01, // NYM — Citi Field
  143: 1.01, // PHI — Citizens Bank Park
  120: 1.00, // WSH — Nationals Park
  // NL Central
  112: 1.01, // CHC — Wrigley Field
  113: 1.04, // CIN — Great American Ball Park
  158: 0.99, // MIL — American Family Field
  134: 0.97, // PIT — PNC Park
  138: 0.99, // STL — Busch Stadium
  // NL West
  109: 1.03, // ARI — Chase Field
  115: 1.12, // COL — Coors Field (outlier)
  119: 1.00, // LAD — Dodger Stadium
  135: 0.97, // SD  — Petco Park
  137: 0.97, // SF  — Oracle Park
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PitcherStats = Record<string, string | number> | null

export type TeamBattingV2 = {
  wOBA: number
  runsPerGame: number
}

export type TeamPitchingV2 = {
  era: number
}

export type MLBv2Analysis = {
  game: MLBGame
  homeFIP: number
  awayFIP: number
  homeIP: number
  awayIP: number
  homeWOBA: number
  awayWOBA: number
  parkFactor: number
  runs_dom: number
  runs_ext: number
  total_final: number
  total_F5: number
  signal: Signal | null
  hasPitcherData: boolean
}

// ── FIP ───────────────────────────────────────────────────────────────────────
export function computeFIP(stats: PitcherStats): number {
  if (!stats) return LEAGUE_FIP
  const ip  = parseFloat(String(stats.inningsPitched ?? '0'))
  if (ip < 10) return LEAGUE_FIP
  const hr  = Number(stats.homeRuns ?? 0)
  const bb  = Number(stats.baseOnBalls ?? 0)
  const hbp = Number(stats.hitByPitch ?? Math.round(bb * 0.08))
  const k   = Number(stats.strikeOuts ?? 0)
  return Math.max(1.50, Math.min(8.00, (13 * hr + 3 * (bb + hbp) - 2 * k) / ip + FIP_CONSTANT))
}

export function starterIPperStart(stats: PitcherStats): number {
  if (!stats) return DEFAULT_STARTER_IP
  const ip = parseFloat(String(stats.inningsPitched ?? '0'))
  const gs = Number(stats.gamesStarted ?? stats.gamesPitched ?? 1)
  if (gs < 2 || ip < 5) return DEFAULT_STARTER_IP
  return Math.max(3.0, Math.min(9.0, ip / gs))
}

// ── wOBA depuis les stats batting d'équipe ────────────────────────────────────
function computeWOBAFromStat(st: Record<string, unknown>): number {
  const ab  = Number(st.atBats      ?? 400)
  const h   = Number(st.hits        ?? 100)
  const d2  = Number(st.doubles     ?? 20)
  const d3  = Number(st.triples     ?? 3)
  const hr  = Number(st.homeRuns    ?? 15)
  const bb  = Number(st.baseOnBalls ?? 35)
  const hbp = Number(st.hitByPitch  ?? Math.round(bb * 0.08))
  const sf  = Number(st.sacFlies    ?? Math.round(ab * 0.005))
  const s1b = Math.max(0, h - d2 - d3 - hr)
  const denom = ab + bb + sf + hbp
  if (denom === 0) return LEAGUE_wOBA
  return Math.max(0.200, Math.min(0.420,
    (0.7 * bb + 0.9 * s1b + 1.25 * d2 + 1.6 * d3 + 2.0 * hr) / denom
  ))
}

// ── Fetch team batting (pour wOBA) ────────────────────────────────────────────
export async function getTeamBattingV2(teamId: number): Promise<TeamBattingV2> {
  const fallback = { wOBA: LEAGUE_wOBA, runsPerGame: LEAGUE_RUNS_PER_GAME }
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/teams/${teamId}/stats?stats=season&group=hitting&season=${year}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return fallback
    const data = await res.json()
    const st = data.stats?.[0]?.splits?.[0]?.stat
    if (!st) return fallback
    const gp = Number(st.gamesPlayed ?? 1)
    return {
      wOBA: computeWOBAFromStat(st as Record<string, unknown>),
      runsPerGame: gp > 0 ? Number(st.runs ?? 0) / gp : LEAGUE_RUNS_PER_GAME,
    }
  } catch {
    return fallback
  }
}

// ── Fetch team pitching (ERA bullpen proxy) ───────────────────────────────────
export async function getTeamPitchingV2(teamId: number): Promise<TeamPitchingV2> {
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/teams/${teamId}/stats?stats=season&group=pitching&season=${year}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { era: LEAGUE_FIP }
    const data = await res.json()
    const st = data.stats?.[0]?.splits?.[0]?.stat
    return { era: st?.era ? parseFloat(String(st.era)) : LEAGUE_FIP }
  } catch {
    return { era: LEAGUE_FIP }
  }
}

// ── Bloc 1 : Estimation des runs ───────────────────────────────────────────────
// runs_off = LEAGUE_AVG × (wOBA_off / wOBA_ligue) × (FIP_def / FIP_ligue) × (IP_def / 9)
//           + (bullpenERA_def / 9) × (9 - IP_def) × fatigue
//
// "off" = équipe qui marque, "def" = lanceur+bullpen qui défend
export function estimateRuns(
  wOBA_off:      number,
  FIP_def:       number,
  IP_def:        number,
  bullpenERA_def: number,
  fatigue = 1.0,
): number {
  const starterContrib =
    LEAGUE_RUNS_PER_GAME * (wOBA_off / LEAGUE_wOBA) * (FIP_def / LEAGUE_FIP) * (IP_def / 9)
  const bullpenInnings = Math.max(0, 9 - IP_def)
  const bullpenContrib = (bullpenERA_def / 9) * bullpenInnings * fatigue
  return Math.max(0.3, starterContrib + bullpenContrib)
}

// ── Bloc 2 : Génération du signal ─────────────────────────────────────────────
export function generateMLBv2Signal(
  game: MLBGame,
  homeStarterStats: PitcherStats,
  awayStarterStats:  PitcherStats,
  homeHitting: TeamBattingV2,
  awayHitting:  TeamBattingV2,
  homePitching: TeamPitchingV2,
  awayPitching:  TeamPitchingV2,
): Signal | null {
  const homeFIP = computeFIP(homeStarterStats)
  const awayFIP = computeFIP(awayStarterStats)
  const homeIP  = starterIPperStart(homeStarterStats)
  const awayIP  = starterIPperStart(awayStarterStats)

  const parkFactor = PARK_FACTOR[game.teams.home.team.id] ?? 1.00

  // Runs estimés
  const runs_dom = estimateRuns(homeHitting.wOBA, awayFIP, awayIP, awayPitching.era)
  const runs_ext = estimateRuns(awayHitting.wOBA, homeFIP, homeIP, homePitching.era)

  const total_final = (runs_dom + runs_ext) * parkFactor
  const total_F5    = (runs_dom + runs_ext) * (Math.min(homeIP, awayIP) / 9)

  const matchStr = `${game.teams.home.team.name} vs ${game.teams.away.team.name}`
  const date  = game.officialDate
  const heure = new Date(game.gameDate).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })

  const wStr = (w: number) => `.${String(Math.round(w * 1000)).padStart(3, '0')}`

  // ── Signal 1 : UNDER F5 — deux starters dominants (Priorité 1) ────────────
  if (homeFIP < 3.50 && awayFIP < 3.50) {
    const force: SignalForce = homeFIP < 3.20 && awayFIP < 3.20 ? 'fort' : 'modéré'
    return {
      id:       `mlbv2-${game.gamePk}-under-f5`,
      sport:    'MLB',
      match:    matchStr,
      flagDom:  '🏟️',
      flagExt:  '⚾',
      date, heure, force,
      typePari: 'First 5 Innings',
      pari:     `UNDER F5 — total estimé ~${total_F5.toFixed(1)} pts`,
      raisonnement: `Duel de starters dominants : FIP dom. ${homeFIP.toFixed(2)} / ext. ${awayFIP.toFixed(2)} (tous deux < 3.50). Total F5 estimé à ~${total_F5.toFixed(1)} pts — cherche une ligne F5 ≥ ${total_F5.toFixed(1)} pour une value positive. Park factor : ×${parkFactor.toFixed(2)}.`,
      stats: [
        { label: `${game.teams.home.team.abbreviation} FIP`,  val: homeFIP.toFixed(2), highlight: true },
        { label: `${game.teams.away.team.abbreviation} FIP`,  val: awayFIP.toFixed(2), highlight: true },
        { label: 'Total F5 estimé',                           val: `~${total_F5.toFixed(1)}`, highlight: true },
        { label: 'Park factor',                               val: `×${parkFactor.toFixed(2)}` },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ── Signal 2 : MONEYLINE — avantage runs significatif (Priorité 2) ─────────
  const runsDiff = runs_dom - runs_ext
  if (Math.abs(runsDiff) >= 1.2) {
    const favHome   = runsDiff > 0
    const favTeam   = favHome ? game.teams.home.team : game.teams.away.team
    const favRuns   = favHome ? runs_dom : runs_ext
    const oppRuns   = favHome ? runs_ext : runs_dom
    const favWOBA   = favHome ? homeHitting.wOBA : awayHitting.wOBA
    const favFIPadv = favHome ? awayFIP : homeFIP  // FIP du lanceur adverse
    const pImpl     = favRuns / (favRuns + oppRuns)
    const force: SignalForce = Math.abs(runsDiff) >= 1.8 ? 'fort' : 'modéré'
    return {
      id:       `mlbv2-${game.gamePk}-ml`,
      sport:    'MLB',
      match:    matchStr,
      flagDom:  '🏟️',
      flagExt:  '⚾',
      date, heure, force,
      typePari: 'Moneyline',
      pari:     `Victoire ${favTeam.name} — Moneyline`,
      raisonnement: `Avantage de ${Math.abs(runsDiff).toFixed(1)} runs estimés (${favRuns.toFixed(1)} vs ${oppRuns.toFixed(1)}). ${favTeam.name} : wOBA off. ${wStr(favWOBA)} contre FIP adverse ${favFIPadv.toFixed(2)}. P(win) implicite ≈ ${Math.round(pImpl * 100)}% — cherche cote ≥ ${(1 / pImpl).toFixed(2)}.`,
      stats: [
        { label: `${favTeam.abbreviation} runs est.`, val: favRuns.toFixed(1),           highlight: true },
        { label: 'FIP starter adverse',               val: favFIPadv.toFixed(2),          highlight: true },
        { label: `wOBA offense`,                      val: wStr(favWOBA) },
        { label: 'P(win) implicite',                  val: `${Math.round(pImpl * 100)}%`, highlight: true },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ── Signal 3 : UNDER complet — deux défenses solides + stade neutre (Priorité 3) ──
  if (total_final < 8.0 && parkFactor <= 1.00) {
    const force: SignalForce = total_final < 7.0 ? 'fort' : 'modéré'
    return {
      id:       `mlbv2-${game.gamePk}-under`,
      sport:    'MLB',
      match:    matchStr,
      flagDom:  '🏟️',
      flagExt:  '⚾',
      date, heure, force,
      typePari: 'Under (Total)',
      pari:     `UNDER ~${total_final.toFixed(1)} pts`,
      raisonnement: `Total estimé à ${total_final.toFixed(1)} pts dans un stade neutre/pitcher-friendly (park factor ×${parkFactor.toFixed(2)}). FIP dom. ${homeFIP.toFixed(2)}, ext. ${awayFIP.toFixed(2)}. Cherche une ligne ≥ ${total_final.toFixed(1)}.`,
      stats: [
        { label: 'Total estimé',                             val: `~${total_final.toFixed(1)}`, highlight: true },
        { label: 'Park factor',                              val: `×${parkFactor.toFixed(2)}`,   highlight: true },
        { label: `${game.teams.home.team.abbreviation} FIP`, val: homeFIP.toFixed(2) },
        { label: `${game.teams.away.team.abbreviation} FIP`, val: awayFIP.toFixed(2) },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  // ── Signal 4 : OVER — offenses prolifiques + stade hitter-friendly (Priorité 4) ──
  const bothOffensif =
    homeHitting.wOBA > LEAGUE_wOBA * 1.05 && awayHitting.wOBA > LEAGUE_wOBA * 1.05
  if (total_final > 10.5 && (parkFactor >= 1.05 || bothOffensif)) {
    return {
      id:       `mlbv2-${game.gamePk}-over`,
      sport:    'MLB',
      match:    matchStr,
      flagDom:  '🏟️',
      flagExt:  '⚾',
      date, heure,
      force:    'modéré',
      typePari: 'Over (Total)',
      pari:     `OVER ~${total_final.toFixed(1)} pts`,
      raisonnement: `Total estimé à ${total_final.toFixed(1)} pts — deux offenses prolifiques (wOBA dom. ${wStr(homeHitting.wOBA)} / ext. ${wStr(awayHitting.wOBA)}) ${parkFactor >= 1.05 ? `dans un stade hitter-friendly (park factor ×${parkFactor.toFixed(2)})` : 'avec des offenses au-dessus de la moyenne'}. Cherche une ligne ≤ ${total_final.toFixed(1)}.`,
      stats: [
        { label: 'Total estimé',                               val: `~${total_final.toFixed(1)}`,   highlight: true },
        { label: 'Park factor',                                val: `×${parkFactor.toFixed(2)}`,     highlight: parkFactor >= 1.05 },
        { label: `${game.teams.home.team.abbreviation} wOBA`,  val: wStr(homeHitting.wOBA),          highlight: homeHitting.wOBA > LEAGUE_wOBA * 1.05 },
        { label: `${game.teams.away.team.abbreviation} wOBA`,  val: wStr(awayHitting.wOBA),          highlight: awayHitting.wOBA > LEAGUE_wOBA * 1.05 },
      ],
      lienCalculateur: '/paris/calculateur',
    }
  }

  return null
}

// ── Analyse complète d'un match (exposée pour la page v2) ─────────────────────
export async function analyzeGameV2(game: MLBGame): Promise<MLBv2Analysis> {
  const homeId = game.teams.home.team.id
  const awayId = game.teams.away.team.id

  const [homeStarterStats, awayStarterStats, homeHitting, awayHitting, homePitching, awayPitching] =
    await Promise.all([
      game.teams.home.probablePitcher?.id
        ? getPitcherSeasonStats(game.teams.home.probablePitcher.id)
        : Promise.resolve(null),
      game.teams.away.probablePitcher?.id
        ? getPitcherSeasonStats(game.teams.away.probablePitcher.id)
        : Promise.resolve(null),
      getTeamBattingV2(homeId),
      getTeamBattingV2(awayId),
      getTeamPitchingV2(homeId),
      getTeamPitchingV2(awayId),
    ])

  const homeFIP   = computeFIP(homeStarterStats)
  const awayFIP   = computeFIP(awayStarterStats)
  const homeIP    = starterIPperStart(homeStarterStats)
  const awayIP    = starterIPperStart(awayStarterStats)
  const parkFactor = PARK_FACTOR[homeId] ?? 1.00
  const runs_dom  = estimateRuns(homeHitting.wOBA, awayFIP, awayIP, awayPitching.era)
  const runs_ext  = estimateRuns(awayHitting.wOBA, homeFIP, homeIP, homePitching.era)

  return {
    game,
    homeFIP, awayFIP, homeIP, awayIP,
    homeWOBA:   homeHitting.wOBA,
    awayWOBA:   awayHitting.wOBA,
    parkFactor,
    runs_dom, runs_ext,
    total_final: (runs_dom + runs_ext) * parkFactor,
    total_F5:    (runs_dom + runs_ext) * (Math.min(homeIP, awayIP) / 9),
    signal:      generateMLBv2Signal(game, homeStarterStats, awayStarterStats, homeHitting, awayHitting, homePitching, awayPitching),
    hasPitcherData: !!(game.teams.home.probablePitcher?.id || game.teams.away.probablePitcher?.id),
  }
}

// ── Point d'entrée principal ───────────────────────────────────────────────────
export async function generateMLBv2SignalsForToday(): Promise<Signal[]> {
  const { getSchedule } = await import('./mlb-api')
  const games = await getSchedule()
  const previewGames = games.filter(g => g.status.abstractGameState === 'Preview')
  if (!previewGames.length) return []

  const analyses = await Promise.all(previewGames.map(analyzeGameV2))
  const signals = analyses.map(a => a.signal).filter(Boolean) as Signal[]

  const forceOrder: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
  return signals.sort((a, b) => forceOrder[a.force] - forceOrder[b.force])
}
