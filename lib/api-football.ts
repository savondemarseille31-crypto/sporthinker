const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'

export const LEAGUES = {
  WORLD_CUP: 1,
  CHAMPIONS_LEAGUE: 2,
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  LIGUE_1: 61,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  MLS: 253,
} as const

async function apiFetch<T = unknown>(path: string, ttl = 3600): Promise<T> {
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

// ---- Types ----

export type AFFixture = {
  fixture: {
    id: number
    date: string
    referee: string | null
    status: { long: string; short: string; elapsed: number | null }
  }
  league: { id: number; name: string; season: number; round: string }
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null }
    away: { id: number; name: string; logo: string; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
}

export type AFTeamMatchStats = {
  xG: number
  corners: number
  yellowCards: number
  redCards: number
  possession: number
  shots: number
  shotsOnTarget: number
  goals: number
}

export type AFFixtureWithStats = {
  fixtureId: number
  date: string
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeGoals: number
  awayGoals: number
  homeStats: AFTeamMatchStats
  awayStats: AFTeamMatchStats
  referee: string | null
}

export type AFPlayerStats = {
  playerId: number
  name: string
  position: string
  shots: number
  shotsOnTarget: number
  goals: number
  assists: number
  passes: number
  keyPasses: number
  tackles: number
  yellowCard: boolean
  redCard: boolean
  rating: number
  minutesPlayed: number
}

// ---- Helpers ----

type RawStat = { type: string; value: string | number | null }

function parseStat(stats: RawStat[], type: string): number {
  const s = stats.find(s => s.type === type)
  if (!s || s.value === null) return 0
  return parseFloat(String(s.value).replace('%', '')) || 0
}

const EMPTY_STATS: AFTeamMatchStats = {
  xG: 0, corners: 0, yellowCards: 0, redCards: 0,
  possession: 50, shots: 0, shotsOnTarget: 0, goals: 0,
}

function parseTeamStats(rawStats: RawStat[], goals: number): AFTeamMatchStats {
  return {
    xG: parseStat(rawStats, 'expected_goals'),
    corners: parseStat(rawStats, 'Corner Kicks'),
    yellowCards: parseStat(rawStats, 'Yellow Cards'),
    redCards: parseStat(rawStats, 'Red Cards'),
    possession: parseStat(rawStats, 'Ball Possession'),
    shots: parseStat(rawStats, 'Total Shots'),
    shotsOnTarget: parseStat(rawStats, 'Shots on Goal'),
    goals,
  }
}

// ---- Endpoints ----

export async function getFixturesByDate(date: string, leagueId: number, season: number): Promise<AFFixture[]> {
  return apiFetch(`/fixtures?date=${date}&league=${leagueId}&season=${season}`, 300)
}

export async function getFixtureStats(fixtureId: number): Promise<{ home: AFTeamMatchStats; away: AFTeamMatchStats } | null> {
  type Raw = { team: { id: number }; statistics: RawStat[] }[]
  const raw = await apiFetch<Raw>(`/fixtures/statistics?fixture=${fixtureId}`, 3600)
  if (!raw || raw.length < 2) return null
  return {
    home: parseTeamStats(raw[0].statistics, 0),
    away: parseTeamStats(raw[1].statistics, 0),
  }
}

export async function getTeamRecentFixtures(teamId: number, leagueId: number, season: number, n = 5): Promise<AFFixture[]> {
  return apiFetch(`/fixtures?team=${teamId}&league=${leagueId}&season=${season}&last=${n}&status=FT`, 3600)
}

export async function getTeamFormWithStats(teamId: number, leagueId: number, season: number, n = 5): Promise<AFFixtureWithStats[]> {
  const fixtures = await getTeamRecentFixtures(teamId, leagueId, season, n)
  if (!fixtures.length) return []

  const results: AFFixtureWithStats[] = []
  for (const f of fixtures) {
    const homeGoals = f.goals.home ?? 0
    const awayGoals = f.goals.away ?? 0
    const rawStats = await getFixtureStats(f.fixture.id)

    results.push({
      fixtureId: f.fixture.id,
      date: f.fixture.date,
      homeTeam: { id: f.teams.home.id, name: f.teams.home.name },
      awayTeam: { id: f.teams.away.id, name: f.teams.away.name },
      homeGoals,
      awayGoals,
      homeStats: rawStats ? { ...rawStats.home, goals: homeGoals } : { ...EMPTY_STATS, goals: homeGoals },
      awayStats: rawStats ? { ...rawStats.away, goals: awayGoals } : { ...EMPTY_STATS, goals: awayGoals },
      referee: f.fixture.referee,
    })
  }
  return results
}

export async function getH2H(team1Id: number, team2Id: number, last = 5): Promise<AFFixture[]> {
  return apiFetch(`/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=${last}`, 86400)
}

// Stats joueurs pour un match + une équipe spécifique
export async function getFixturePlayers(fixtureId: number, teamId: number): Promise<AFPlayerStats[]> {
  type RawTeam = {
    team: { id: number }
    players: {
      player: { id: number; name: string }
      statistics: [{
        shots: { total: number | null; on: number | null }
        goals: { total: number | null; assists: number | null }
        passes: { total: number | null; key: number | null }
        tackles: { total: number | null }
        cards: { yellow: number; red: number }
        games: { rating: string | null; minutes: number | null; position: string | null }
      }]
    }[]
  }[]

  const raw = await apiFetch<RawTeam>(`/fixtures/players?fixture=${fixtureId}&team=${teamId}`, 3600)
  const teamData = raw.find(r => r.team.id === teamId)
  if (!teamData) return []

  return teamData.players.map(p => {
    const s = p.statistics[0]
    return {
      playerId: p.player.id,
      name: p.player.name,
      position: s?.games?.position ?? '?',
      shots: s?.shots?.total ?? 0,
      shotsOnTarget: s?.shots?.on ?? 0,
      goals: s?.goals?.total ?? 0,
      assists: s?.goals?.assists ?? 0,
      passes: s?.passes?.total ?? 0,
      keyPasses: s?.passes?.key ?? 0,
      tackles: s?.tackles?.total ?? 0,
      yellowCard: (s?.cards?.yellow ?? 0) > 0,
      redCard: (s?.cards?.red ?? 0) > 0,
      rating: parseFloat(s?.games?.rating ?? '0') || 0,
      minutesPlayed: s?.games?.minutes ?? 0,
    }
  })
}

// Stats saison tous les joueurs d'une équipe (pour les props)
export async function getTeamSeasonPlayerStats(teamId: number, leagueId: number, season: number) {
  return apiFetch(`/players?team=${teamId}&league=${leagueId}&season=${season}`, 3600)
}

// Fonctions legacy CdM (backward compat)
export async function getCdmTeams() {
  return apiFetch('/teams?league=1&season=2026')
}

export async function getCdmFixtures() {
  return apiFetch('/fixtures?league=1&season=2026')
}

export async function getCdmStandings() {
  return apiFetch('/standings?league=1&season=2026')
}

export async function getOdds(fixtureId: number) {
  return apiFetch(`/odds?fixture=${fixtureId}&bookmaker=6`)
}

export async function getTeamStats(teamId: number) {
  return apiFetch(`/teams/statistics?league=1&season=2026&team=${teamId}`)
}
