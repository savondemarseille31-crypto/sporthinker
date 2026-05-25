const BASE = 'https://api.balldontlie.io/v1'

function authHeaders() {
  return { Authorization: process.env.BALLDONTLIE_KEY ?? '' }
}

// =============================================
// TYPES
// =============================================
export type NBATeam = {
  id: number
  abbreviation: string
  full_name: string
  conference: string
  division: string
}

export type NBAGame = {
  id: number
  date: string
  season: number
  status: string
  period: number
  postseason: boolean
  home_team_score: number
  visitor_team_score: number
  home_team: NBATeam
  visitor_team: NBATeam
}

export type NBAPlayer = {
  id: number
  first_name: string
  last_name: string
  position: string
  team_id: number
}

export type NBAPlayerAverage = {
  player: {
    id: number
    first_name: string
    last_name: string
  }
  pts: number
  reb: number
  ast: number
  blk: number
  stl: number
  fg_pct: number
  fg3_pct: number
  ft_pct: number
  min: string
  games_played: number
}

export type NBAPlayerGameLog = {
  id: number
  player: { id: number; first_name: string; last_name: string }
  team: { id: number; abbreviation: string }
  game: { id: number; date: string; home_team_score: number; visitor_team_score: number }
  pts: number
  reb: number
  ast: number
  blk: number
  stl: number
  fg3m: number
  fg_pct: number
  ft_pct: number
  min: string
}

// =============================================
// MAPPING ÉQUIPES (logos emoji + couleurs)
// =============================================
export const NBA_TEAMS: Record<number, { emoji: string; color: string; shortName: string }> = {
  1:  { emoji: '🦅', color: 'text-red-500',    shortName: 'ATL' },
  2:  { emoji: '🍀', color: 'text-green-500',  shortName: 'BOS' },
  3:  { emoji: '🌉', color: 'text-gray-400',   shortName: 'BKN' },
  4:  { emoji: '🐝', color: 'text-teal-400',   shortName: 'CHA' },
  5:  { emoji: '🐂', color: 'text-red-600',    shortName: 'CHI' },
  6:  { emoji: '⚡', color: 'text-red-800',    shortName: 'CLE' },
  7:  { emoji: '🤠', color: 'text-blue-500',   shortName: 'DAL' },
  8:  { emoji: '🏔️', color: 'text-yellow-500', shortName: 'DEN' },
  9:  { emoji: '🏎️', color: 'text-blue-600',   shortName: 'DET' },
  10: { emoji: '🌉', color: 'text-yellow-400', shortName: 'GSW' },
  11: { emoji: '🚀', color: 'text-red-500',    shortName: 'HOU' },
  12: { emoji: '🏎️', color: 'text-yellow-500', shortName: 'IND' },
  13: { emoji: '✂️', color: 'text-red-500',    shortName: 'LAC' },
  14: { emoji: '💜', color: 'text-purple-500', shortName: 'LAL' },
  15: { emoji: '🐻', color: 'text-blue-900',   shortName: 'MEM' },
  16: { emoji: '🌴', color: 'text-red-500',    shortName: 'MIA' },
  17: { emoji: '🦌', color: 'text-green-600',  shortName: 'MIL' },
  18: { emoji: '🐺', color: 'text-blue-900',   shortName: 'MIN' },
  19: { emoji: '⚜️', color: 'text-yellow-500', shortName: 'NOP' },
  20: { emoji: '🗽', color: 'text-orange-500', shortName: 'NYK' },
  21: { emoji: '⛈️', color: 'text-blue-500',   shortName: 'OKC' },
  22: { emoji: '🏀', color: 'text-blue-500',   shortName: 'ORL' },
  23: { emoji: '🔔', color: 'text-red-500',    shortName: 'PHI' },
  24: { emoji: '☀️', color: 'text-orange-500', shortName: 'PHX' },
  25: { emoji: '⚫', color: 'text-red-600',    shortName: 'POR' },
  26: { emoji: '👑', color: 'text-purple-500', shortName: 'SAC' },
  27: { emoji: '🤠', color: 'text-gray-400',   shortName: 'SAS' },
  28: { emoji: '🦖', color: 'text-red-500',    shortName: 'TOR' },
  29: { emoji: '🏔️', color: 'text-blue-900',   shortName: 'UTA' },
  30: { emoji: '🦅', color: 'text-red-600',    shortName: 'WAS' },
}

// =============================================
// API FUNCTIONS
// =============================================

export async function getTodayPlayoffGames(date?: string): Promise<NBAGame[]> {
  try {
    const d = date ?? new Date().toISOString().split('T')[0]
    const url = `${BASE}/games?seasons[]=2025&postseason=true&dates[]=${d}&per_page=10`
    const res = await fetch(url, {
      headers: authHeaders(),
      next: { revalidate: 60 }, // cache 60s — évite les appels dupliqués entre pages
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []) as NBAGame[]
  } catch {
    return []
  }
}

export async function getTeamPlayoffGames(teamId: number, limit = 20): Promise<NBAGame[]> {
  try {
    const url = `${BASE}/games?seasons[]=2025&postseason=true&team_ids[]=${teamId}&per_page=${limit}`
    const res = await fetch(url, {
      headers: authHeaders(),
      next: { revalidate: 60 }, // cache 60s — partagé entre signaux et page NBA
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []) as NBAGame[]
  } catch {
    return []
  }
}

export async function getSeriesGames(team1Id: number, team2Id: number): Promise<NBAGame[]> {
  try {
    const games = await getTeamPlayoffGames(team1Id, 20)
    const series = games.filter(g =>
      g.home_team.id === team2Id || g.visitor_team.id === team2Id
    )
    return series.sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

export async function getTeamTopPlayers(teamId: number, limit = 5): Promise<NBAPlayerAverage[]> {
  try {
    const playersRes = await fetch(
      `${BASE}/players?team_ids[]=${teamId}&per_page=15`,
      { headers: authHeaders(), cache: 'no-store' }
    )
    if (!playersRes.ok) return []
    const playersData = await playersRes.json()
    const players: NBAPlayer[] = playersData.data ?? []
    if (players.length === 0) return []

    const ids = players.slice(0, 12).map(p => p.id)
    const idsQuery = ids.map(id => `player_ids[]=${id}`).join('&')
    const avgRes = await fetch(
      `${BASE}/season_averages?season=2025&postseason=true&${idsQuery}`,
      { headers: authHeaders(), cache: 'no-store' }
    )
    if (!avgRes.ok) return []
    const avgData = await avgRes.json()
    const averages: NBAPlayerAverage[] = avgData.data ?? []

    // Enrich with player info and sort by pts
    const enriched = averages
      .filter(a => a.pts != null)
      .map(a => {
        const p = players.find(pl => pl.id === a.player?.id)
        return {
          ...a,
          player: {
            id: a.player?.id ?? 0,
            first_name: p?.first_name ?? a.player?.first_name ?? '',
            last_name: p?.last_name ?? a.player?.last_name ?? '',
          },
        }
      })
      .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0))
      .slice(0, limit)

    return enriched
  } catch {
    return []
  }
}

// =============================================
// HELPERS
// =============================================

export function formatGameStatus(game: NBAGame): string {
  const s = game.status
  if (s === 'Final') return 'Final'
  // ISO datetime → upcoming
  if (s.includes('T') && s.includes('Z')) {
    const d = new Date(s)
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    })
  }
  // live: "3 Qtr 8:24" or similar
  return s
}

export function computeSeriesScore(
  seriesGames: NBAGame[],
  team1Id: number,
  team2Id: number
): { team1Wins: number; team2Wins: number } {
  let team1Wins = 0
  let team2Wins = 0
  for (const g of seriesGames) {
    if (g.status !== 'Final') continue
    const homeWon = g.home_team_score > g.visitor_team_score
    if (homeWon) {
      if (g.home_team.id === team1Id) team1Wins++
      else if (g.home_team.id === team2Id) team2Wins++
    } else {
      if (g.visitor_team.id === team1Id) team1Wins++
      else if (g.visitor_team.id === team2Id) team2Wins++
    }
  }
  return { team1Wins, team2Wins }
}

export function seriesScoreLabel(
  seriesGames: NBAGame[],
  homeTeamId: number,
  awayTeamId: number
): string {
  const { team1Wins, team2Wins } = computeSeriesScore(seriesGames, homeTeamId, awayTeamId)
  if (team1Wins === team2Wins) return `Égalité ${team1Wins}-${team2Wins}`
  const leader = team1Wins > team2Wins ? homeTeamId : awayTeamId
  const leaderInfo = NBA_TEAMS[leader]
  const wins = Math.max(team1Wins, team2Wins)
  const losses = Math.min(team1Wins, team2Wins)
  return `${leaderInfo?.shortName ?? leader} mène ${wins}-${losses}`
}

// =============================================
// PLAYER PROPS & STATS FUNCTIONS
// =============================================

export async function getPlayerGameLogs(playerId: number, limit = 8): Promise<NBAPlayerGameLog[]> {
  try {
    const url = `${BASE}/stats?seasons[]=2025&postseason=true&player_ids[]=${playerId}&per_page=${limit}`
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    const logs: NBAPlayerGameLog[] = data.data ?? []
    // Filter out DNPs (min "00" or "0:00" or "00:00")
    const played = logs.filter(l => {
      const m = l.min ?? ''
      return m !== '' && m !== '00' && m !== '0:00' && m !== '00:00'
    })
    // Sort by date desc (most recent first)
    played.sort((a, b) => (b.game?.date ?? '').localeCompare(a.game?.date ?? ''))
    return played
  } catch {
    return []
  }
}

export async function getTeamPlayersWithAverages(teamId: number, limit = 8): Promise<NBAPlayerAverage[]> {
  try {
    // 1. Fetch players for a team
    const playersRes = await fetch(
      `${BASE}/players?team_ids[]=${teamId}&per_page=20`,
      { headers: authHeaders(), cache: 'no-store' }
    )
    if (!playersRes.ok) return []
    const playersData = await playersRes.json()
    // Filter to active roster (only team IDs 1-30)
    const players: Array<{ id: number; first_name: string; last_name: string; team: { id: number } }> =
      (playersData.data ?? []).filter((p: { team?: { id: number } }) => p.team && p.team.id >= 1 && p.team.id <= 30)
    if (players.length === 0) return []

    // 2. Fetch season averages for those player IDs
    const ids = players.slice(0, 20).map(p => p.id)
    const idsQuery = ids.map(id => `player_ids[]=${id}`).join('&')
    const avgRes = await fetch(
      `${BASE}/season_averages?season=2025&postseason=true&${idsQuery}`,
      { headers: authHeaders(), cache: 'no-store' }
    )
    if (!avgRes.ok) return []
    const avgData = await avgRes.json()
    const averages: NBAPlayerAverage[] = avgData.data ?? []

    // 3. Filter active playoff players and enrich
    const enriched = averages
      .filter(a => {
        const gp = a.games_played ?? 0
        const m = a.min ?? ''
        return gp > 0 && m !== '' && m !== '0:00' && m !== '00:00' && m !== '00'
      })
      .map(a => {
        const p = players.find(pl => pl.id === a.player?.id)
        return {
          ...a,
          player: {
            id: a.player?.id ?? 0,
            first_name: p?.first_name ?? a.player?.first_name ?? '',
            last_name: p?.last_name ?? a.player?.last_name ?? '',
          },
        }
      })
      .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0))
      .slice(0, limit)

    return enriched
  } catch {
    return []
  }
}

export async function getTopPlayoffPerformers(
  stat: 'pts' | 'reb' | 'ast' | 'blk' | 'stl',
  limit = 15
): Promise<NBAPlayerAverage[]> {
  try {
    // 1. Get recent playoff games to find active teams
    const gamesRes = await fetch(
      `${BASE}/games?seasons[]=2025&postseason=true&per_page=50`,
      { headers: authHeaders(), cache: 'no-store' }
    )
    if (!gamesRes.ok) return []
    const gamesData = await gamesRes.json()
    const games: NBAGame[] = gamesData.data ?? []

    // 2. Get unique team IDs from recent playoff games
    const teamIdSet = new Set<number>()
    for (const g of games) {
      teamIdSet.add(g.home_team.id)
      teamIdSet.add(g.visitor_team.id)
    }
    const teamIds = Array.from(teamIdSet).filter(id => id >= 1 && id <= 30)
    if (teamIds.length === 0) return []

    // 3. For each team, get players
    const playerMaps = await Promise.all(
      teamIds.map(async (tid) => {
        const res = await fetch(
          `${BASE}/players?team_ids[]=${tid}&per_page=15`,
          { headers: authHeaders(), cache: 'no-store' }
        )
        if (!res.ok) return []
        const d = await res.json()
        return (d.data ?? []) as Array<{ id: number; first_name: string; last_name: string; team: { id: number } }>
      })
    )

    // Deduplicate players
    const playerMap = new Map<number, { id: number; first_name: string; last_name: string; team: { id: number } }>()
    for (const arr of playerMaps) {
      for (const p of arr) {
        if (!playerMap.has(p.id)) playerMap.set(p.id, p)
      }
    }

    // 4. Batch fetch season averages (max 20 at a time)
    const allPlayerIds = Array.from(playerMap.keys())
    const batchSize = 20
    const allAverages: NBAPlayerAverage[] = []

    for (let i = 0; i < allPlayerIds.length; i += batchSize) {
      const batch = allPlayerIds.slice(i, i + batchSize)
      const idsQuery = batch.map(id => `player_ids[]=${id}`).join('&')
      const avgRes = await fetch(
        `${BASE}/season_averages?season=2025&postseason=true&${idsQuery}`,
        { headers: authHeaders(), cache: 'no-store' }
      )
      if (!avgRes.ok) continue
      const avgData = await avgRes.json()
      const batchAvgs: NBAPlayerAverage[] = avgData.data ?? []
      allAverages.push(...batchAvgs)
    }

    // 5. Filter active players, enrich, sort by stat
    const enriched = allAverages
      .filter(a => {
        const gp = a.games_played ?? 0
        const m = a.min ?? ''
        return gp > 0 && m !== '' && m !== '0:00' && m !== '00:00' && m !== '00'
      })
      .map(a => {
        const p = playerMap.get(a.player?.id)
        return {
          ...a,
          player: {
            id: a.player?.id ?? 0,
            first_name: p?.first_name ?? a.player?.first_name ?? '',
            last_name: p?.last_name ?? a.player?.last_name ?? '',
          },
        }
      })
      .sort((a, b) => ((b[stat] as number) ?? 0) - ((a[stat] as number) ?? 0))
      .slice(0, limit)

    return enriched
  } catch {
    return []
  }
}
