const BASE = 'https://statsapi.mlb.com/api/v1'

// =============================================
// TYPES
// =============================================
export type MLBTeamInfo = {
  id: number
  name: string
  abbreviation: string
  teamName: string
  locationName: string
  division?: { id: number; name: string }
  league?: { id: number; name: string }
}

export type MLBPitcher = {
  id: number
  fullName: string
  primaryNumber?: string
}

export type MLBGameTeam = {
  team: MLBTeamInfo
  score?: number
  leagueRecord: { wins: number; losses: number; pct: string }
  probablePitcher?: MLBPitcher
  isWinner?: boolean
}

export type MLBGame = {
  gamePk: number
  gameDate: string
  officialDate: string
  status: {
    abstractGameState: 'Preview' | 'Live' | 'Final'
    detailedState: string
    startTimeTBD: boolean
  }
  teams: { home: MLBGameTeam; away: MLBGameTeam }
  venue: { id: number; name: string }
  linescore?: {
    currentInning?: number
    currentInningOrdinal?: string
    inningHalf?: string
  }
}

export type MLBTeamRecord = {
  team: MLBTeamInfo
  wins: number
  losses: number
  pct: string
  gamesBack: string
  wildCardGamesBack?: string
  streak?: { streakCode: string }
  records?: {
    splitRecords: Array<{ wins: number; losses: number; type: string }>
  }
  runsAllowed?: number
  runsScored?: number
}

export type MLBDivisionStanding = {
  division: { id: number; name: string }
  league: { id: number; name: string }
  teamRecords: MLBTeamRecord[]
}

export type MLBPlayerSplit = {
  player: { id: number; fullName: string }
  team: MLBTeamInfo
  stat: Record<string, string | number>
  season: string
}

// =============================================
// MAPPING ÉQUIPES (logos emoji + couleurs)
// =============================================
export const MLB_TEAMS: Record<number, { emoji: string; color: string; shortName: string }> = {
  // AL East
  110: { emoji: '🦅', color: 'text-orange-400', shortName: 'BAL' },
  111: { emoji: '🧦', color: 'text-red-500', shortName: 'BOS' },
  147: { emoji: '⚾', color: 'text-blue-400', shortName: 'NYY' },
  139: { emoji: '☀️', color: 'text-blue-500', shortName: 'TB' },
  141: { emoji: '🍁', color: 'text-blue-600', shortName: 'TOR' },
  // AL Central
  145: { emoji: '⬛', color: 'text-gray-400', shortName: 'CWS' },
  114: { emoji: '🐶', color: 'text-red-600', shortName: 'CLE' },
  116: { emoji: '🐯', color: 'text-orange-500', shortName: 'DET' },
  118: { emoji: '👑', color: 'text-blue-500', shortName: 'KC' },
  142: { emoji: '🔴', color: 'text-red-500', shortName: 'MIN' },
  // AL West
  117: { emoji: '🚀', color: 'text-orange-500', shortName: 'HOU' },
  108: { emoji: '😇', color: 'text-red-500', shortName: 'LAA' },
  133: { emoji: '🐘', color: 'text-green-500', shortName: 'OAK' },
  136: { emoji: '🧭', color: 'text-teal-500', shortName: 'SEA' },
  140: { emoji: '🤠', color: 'text-blue-500', shortName: 'TEX' },
  // NL East
  144: { emoji: '🪓', color: 'text-blue-500', shortName: 'ATL' },
  146: { emoji: '🐟', color: 'text-teal-400', shortName: 'MIA' },
  121: { emoji: '🗽', color: 'text-blue-400', shortName: 'NYM' },
  143: { emoji: '🔔', color: 'text-red-500', shortName: 'PHI' },
  120: { emoji: '🏛️', color: 'text-red-600', shortName: 'WSH' },
  // NL Central
  112: { emoji: '🐻', color: 'text-blue-600', shortName: 'CHC' },
  113: { emoji: '🔴', color: 'text-red-500', shortName: 'CIN' },
  158: { emoji: '🏺', color: 'text-yellow-500', shortName: 'MIL' },
  134: { emoji: '🦜', color: 'text-yellow-400', shortName: 'PIT' },
  138: { emoji: '🃏', color: 'text-red-600', shortName: 'STL' },
  // NL West
  109: { emoji: '🐍', color: 'text-red-500', shortName: 'ARI' },
  115: { emoji: '⛰️', color: 'text-purple-500', shortName: 'COL' },
  119: { emoji: '💙', color: 'text-blue-500', shortName: 'LAD' },
  135: { emoji: '🏖️', color: 'text-yellow-500', shortName: 'SD' },
  137: { emoji: '🌉', color: 'text-orange-500', shortName: 'SF' },
}

// =============================================
// API FUNCTIONS
// =============================================

export async function getSchedule(date?: string): Promise<MLBGame[]> {
  try {
    const d = date ?? new Date().toISOString().split('T')[0]
    const res = await fetch(
      `${BASE}/schedule?sportId=1&date=${d}&hydrate=probablePitcher,team,linescore`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.dates?.[0]?.games ?? []
  } catch { return [] }
}

export async function getStandings(): Promise<MLBDivisionStanding[]> {
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason&hydrate=team,division,league,streak,records`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.records ?? []
  } catch { return [] }
}

export async function getPitcherSeasonStats(pitcherId: number): Promise<Record<string, string | number> | null> {
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/people/${pitcherId}/stats?stats=season&group=pitching&season=${year}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.stats?.[0]?.splits?.[0]?.stat ?? null
  } catch { return null }
}

export async function getPitcherStats(playerId: number): Promise<Record<string, string | number>> {
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/people/${playerId}/stats?stats=season&group=pitching&season=${year}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return {}
    const data = await res.json()
    return data.stats?.[0]?.splits?.[0]?.stat ?? {}
  } catch { return {} }
}

export async function getGameByPk(gamePk: number): Promise<MLBGame | null> {
  try {
    const res = await fetch(
      `${BASE}/schedule?gamePk=${gamePk}&hydrate=probablePitcher,team,linescore`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.dates?.[0]?.games?.[0] ?? null
  } catch { return null }
}

export type MLBRecentGame = {
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  isHome: boolean   // from the perspective of the requested team
  won: boolean
  total: number
}

export async function getTeamRecentGames(teamId: number, limit = 10): Promise<MLBRecentGame[]> {
  try {
    const year = new Date().getFullYear()
    const today = new Date().toISOString().split('T')[0]
    const seasonStart = `${year}-03-01`
    const res = await fetch(
      `${BASE}/schedule?teamId=${teamId}&sportId=1&startDate=${seasonStart}&endDate=${today}&hydrate=linescore,team`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const games: MLBRecentGame[] = []
    for (const date of (data.dates ?? []).reverse()) {
      for (const g of (date.games ?? [])) {
        if (g.status?.abstractGameState !== 'Final') continue
        const home = g.teams?.home
        const away = g.teams?.away
        if (!home || !away) continue
        const isHome = home.team?.id === teamId
        const myScore = isHome ? (home.score ?? 0) : (away.score ?? 0)
        const oppScore = isHome ? (away.score ?? 0) : (home.score ?? 0)
        games.push({
          date: g.officialDate ?? date.date,
          homeTeam: home.team?.abbreviation ?? '?',
          awayTeam: away.team?.abbreviation ?? '?',
          homeScore: home.score ?? 0,
          awayScore: away.score ?? 0,
          isHome,
          won: myScore > oppScore,
          total: (home.score ?? 0) + (away.score ?? 0),
        })
        if (games.length >= limit) break
      }
      if (games.length >= limit) break
    }
    return games
  } catch { return [] }
}

export type MLBTeamHittingStats = {
  runsPerGame: number
  avg: string
  ops: string
  homeRuns: number
  gamesPlayed: number
}

export async function getTeamHittingStats(teamId: number): Promise<MLBTeamHittingStats | null> {
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/teams/${teamId}/stats?stats=season&group=hitting&season=${year}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const stat = data.stats?.[0]?.splits?.[0]?.stat
    if (!stat) return null
    const gp = Number(stat.gamesPlayed ?? 1)
    return {
      runsPerGame: gp > 0 ? Number(stat.runs ?? 0) / gp : 0,
      avg: stat.avg ?? '.000',
      ops: stat.ops ?? '.000',
      homeRuns: Number(stat.homeRuns ?? 0),
      gamesPlayed: gp,
    }
  } catch { return null }
}

export async function getTopPitchers(limit = 20): Promise<MLBPlayerSplit[]> {
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/stats?stats=season&group=pitching&season=${year}&playerPool=qualified&limit=${limit}&sortStat=earnedRunAverage&order=asc`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.stats?.[0]?.splits ?? []
  } catch { return [] }
}

export async function getTopHitters(limit = 20): Promise<MLBPlayerSplit[]> {
  try {
    const year = new Date().getFullYear()
    const res = await fetch(
      `${BASE}/stats?stats=season&group=hitting&season=${year}&playerPool=qualified&limit=${limit}&sortStat=battingAverage&order=desc`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.stats?.[0]?.splits ?? []
  } catch { return [] }
}

// =============================================
// HELPERS
// =============================================

export function formatGameTime(gameDate: string, tbd: boolean): string {
  if (tbd) return 'Heure TBD'
  const d = new Date(gameDate)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
}

export function getL10(records?: MLBTeamRecord['records']): string {
  if (!records) return '—'
  const l10 = records.splitRecords?.find(r => r.type === 'lastTen')
  return l10 ? `${l10.wins}-${l10.losses}` : '—'
}

export function getHomeRecord(records?: MLBTeamRecord['records']): string {
  if (!records) return '—'
  const h = records.splitRecords?.find(r => r.type === 'home')
  return h ? `${h.wins}-${h.losses}` : '—'
}

export function getAwayRecord(records?: MLBTeamRecord['records']): string {
  if (!records) return '—'
  const a = records.splitRecords?.find(r => r.type === 'away')
  return a ? `${a.wins}-${a.losses}` : '—'
}
