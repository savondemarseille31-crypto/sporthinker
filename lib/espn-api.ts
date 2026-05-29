// =============================================
// ESPN UNOFFICIAL API — No key required
// =============================================

// ESPN utilise des abbréviations différentes des standards NBA
// ex: Spurs = SA (ESPN) vs SAS (balldontlie/standard)
const ESPN_TEAM_ABBR: Record<string, string> = {
  'SAS': 'SA',   // Spurs
  'GSW': 'GS',   // Warriors
  'NOP': 'NO',   // Pelicans
  'NYK': 'NY',   // Knicks
  // alias balldontlie legacy
  'SAN': 'SA',
  'GOS': 'GS',
  'NOR': 'NO',
  'PHO': 'PHX',
}

export function toESPNTeamAbbr(abbr: string): string {
  return ESPN_TEAM_ABBR[abbr] ?? abbr
}

export type ESPNRegularSeasonStats = {
  pts: number
  reb: number
  ast: number
  gamesPlayed: number
}

export type ESPNPlayerGameStats = {
  playerId: string
  displayName: string
  min: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  fg: string    // "13-23"
  fg3: string   // "0-3"
  ft: string    // "11-12"
  fgPct: number // computed: 13/23
  fg3Pct: number
  ftPct: number
  to: number
  pf: number
}

export type ESPNTeamBoxScore = {
  teamAbbr: string
  players: ESPNPlayerGameStats[]
}

export type ESPNGameBoxScore = {
  eventId: string
  date: string
  homeTeam: ESPNTeamBoxScore
  awayTeam: ESPNTeamBoxScore
  seriesSummary?: string
}

export type ESPNPlayerAverage = {
  playerId: string
  espnId: string    // ESPN athlete ID — permet de récupérer les stats saison régulière
  displayName: string
  teamAbbr: string
  gamesPlayed: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  fgPct: number
  fg3Pct: number
  ftPct: number
  min: number
}

export type ESPNCdMOdds = {
  eventId: string
  homeTeam: string
  awayTeam: string
  homeDisplayName: string
  awayDisplayName: string
  date: string
  spread: string        // "MEX -0.5"
  overUnder: number     // 2.5
  homeMoneyLine: number // -185
  awayMoneyLine: number // 500
  hasOdds: boolean
}

// =============================================
// HELPERS
// =============================================

function parseFgPct(fg: string): number {
  if (!fg || !fg.includes('-')) return 0
  const parts = fg.split('-')
  const made = parseFloat(parts[0])
  const att = parseFloat(parts[1])
  if (isNaN(made) || isNaN(att) || att === 0) return 0
  return made / att
}

function parseMinutes(minStr: string): number {
  if (!minStr) return 0
  const m = parseFloat(minStr)
  if (isNaN(m)) return 0
  return m
}

function isDNP(minStr: string): boolean {
  if (!minStr) return true
  const s = minStr.trim()
  return s === '0' || s === '00' || s === '0:00' || s === '00:00' || s === 'DNP'
}

// Format date as YYYYMMDD
function toESPNDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

// =============================================
// NBA FUNCTIONS
// =============================================

export async function getNBAPlayoffEventIds(
  startDate?: string,
  endDate?: string
): Promise<Array<{ id: string; date: string; home: string; away: string }>> {
  try {
    const now = new Date()
    const start = startDate ?? '20260415'
    const end = endDate ?? toESPNDate(now)
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?seasontype=3&dates=${start}-${end}`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()
    const events = data.events ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return events.map((ev: any) => {
      const comps = ev.competitions?.[0]?.competitors ?? []
      // homeAway field: "home" or "away"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const home = comps.find((c: any) => c.homeAway === 'home')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const away = comps.find((c: any) => c.homeAway === 'away')
      return {
        id: ev.id,
        date: ev.date ?? '',
        home: home?.team?.abbreviation ?? '',
        away: away?.team?.abbreviation ?? '',
      }
    })
  } catch {
    return []
  }
}

export async function getNBAGameBoxScore(eventId: string): Promise<ESPNGameBoxScore | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    const data = await res.json()

    const boxscorePlayers = data.boxscore?.players ?? []
    if (boxscorePlayers.length < 2) return null

    // Extract series summary
    const seriesSummary: string | undefined = data.seasonseries?.[0]?.summary ?? undefined

    // Parse one team's players from boxscore.players entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function parseTeam(entry: any): ESPNTeamBoxScore {
      const teamAbbr: string = entry.team?.abbreviation ?? ''
      const stats = entry.statistics?.[0] ?? {}
      const labels: string[] = stats.labels ?? []
      const athletes = stats.athletes ?? []

      // Build label→index map
      const labelIndex: Record<string, number> = {}
      labels.forEach((lbl: string, i: number) => {
        labelIndex[lbl] = i
      })

      const MIN_IDX = labelIndex['MIN'] ?? 0
      const PTS_IDX = labelIndex['PTS'] ?? 1
      const FG_IDX  = labelIndex['FG']  ?? 2
      const FG3_IDX = labelIndex['3PT'] ?? 3
      const FT_IDX  = labelIndex['FT']  ?? 4
      const REB_IDX = labelIndex['REB'] ?? 5
      const AST_IDX = labelIndex['AST'] ?? 6
      const TO_IDX  = labelIndex['TO']  ?? 7
      const STL_IDX = labelIndex['STL'] ?? 8
      const BLK_IDX = labelIndex['BLK'] ?? 9
      const PF_IDX  = labelIndex['PF']  ?? 10

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const players: ESPNPlayerGameStats[] = athletes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a: any) => {
          const playerStats: string[] = a.stats ?? []
          const minStr = playerStats[MIN_IDX] ?? ''
          return !isDNP(minStr)
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => {
          const playerStats: string[] = a.stats ?? []
          const minStr = playerStats[MIN_IDX] ?? '0'
          const fg  = playerStats[FG_IDX]  ?? '0-0'
          const fg3 = playerStats[FG3_IDX] ?? '0-0'
          const ft  = playerStats[FT_IDX]  ?? '0-0'
          return {
            playerId: String(a.athlete?.id ?? ''),
            displayName: a.athlete?.displayName ?? '',
            min: parseMinutes(minStr),
            pts: parseInt(playerStats[PTS_IDX] ?? '0') || 0,
            reb: parseInt(playerStats[REB_IDX] ?? '0') || 0,
            ast: parseInt(playerStats[AST_IDX] ?? '0') || 0,
            stl: parseInt(playerStats[STL_IDX] ?? '0') || 0,
            blk: parseInt(playerStats[BLK_IDX] ?? '0') || 0,
            to:  parseInt(playerStats[TO_IDX]  ?? '0') || 0,
            pf:  parseInt(playerStats[PF_IDX]  ?? '0') || 0,
            fg,
            fg3,
            ft,
            fgPct:  parseFgPct(fg),
            fg3Pct: parseFgPct(fg3),
            ftPct:  parseFgPct(ft),
          }
        })

      return { teamAbbr, players }
    }

    // boxscorePlayers[0] is typically home, [1] away — but let's use team IDs from event metadata
    // We just treat index 0 as team0, index 1 as team1 and resolve home/away from the header
    const headerComps = data.header?.competitions?.[0]?.competitors ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeComp = headerComps.find((c: any) => c.homeAway === 'home')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayComp = headerComps.find((c: any) => c.homeAway === 'away')
    const homeAbbr = homeComp?.team?.abbreviation ?? ''
    const awayAbbr = awayComp?.team?.abbreviation ?? ''

    // Match boxscore entries to home/away
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeEntry = boxscorePlayers.find((e: any) => e.team?.abbreviation === homeAbbr) ?? boxscorePlayers[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayEntry = boxscorePlayers.find((e: any) => e.team?.abbreviation === awayAbbr) ?? boxscorePlayers[1]

    return {
      eventId,
      date: data.header?.competitions?.[0]?.date ?? '',
      homeTeam: parseTeam(homeEntry),
      awayTeam: parseTeam(awayEntry),
      seriesSummary,
    }
  } catch {
    return null
  }
}

export async function getTeamPlayoffPlayerAverages(teamAbbr: string): Promise<ESPNPlayerAverage[]> {
  // Normalise vers l'abbréviation ESPN (ex: SAS → SA, GSW → GS)
  const espnAbbr = toESPNTeamAbbr(teamAbbr)

  // 1. Get all playoff event IDs
  const allEvents = await getNBAPlayoffEventIds()

  // 2. Filter events involving this team
  const teamEvents = allEvents
    .filter(e => e.home === espnAbbr || e.away === espnAbbr)
    .slice(-12)

  if (teamEvents.length === 0) return []

  // 3. Fetch box scores in parallel
  const boxScores = await Promise.all(
    teamEvents.map(e => getNBAGameBoxScore(e.id))
  )

  // 4. Aggregate stats per player
  type PlayerAccum = {
    espnId: string
    displayName: string
    teamAbbr: string
    games: number
    pts: number
    reb: number
    ast: number
    stl: number
    blk: number
    fgMade: number
    fgAtt: number
    fg3Made: number
    fg3Att: number
    ftMade: number
    ftAtt: number
    min: number
    to: number
    pf: number
  }
  const accumMap = new Map<string, PlayerAccum>()

  for (const box of boxScores) {
    if (!box) continue
    // Normalise les abbréviations dans le box score aussi
    const homeAbbr = toESPNTeamAbbr(box.homeTeam.teamAbbr)
    const teamData = homeAbbr === espnAbbr ? box.homeTeam : box.awayTeam
    if (toESPNTeamAbbr(teamData.teamAbbr) !== espnAbbr) continue

    for (const p of teamData.players) {
      const key = p.playerId || p.displayName
      if (!accumMap.has(key)) {
        accumMap.set(key, {
          espnId: p.playerId,
          displayName: p.displayName,
          teamAbbr: espnAbbr,
          games: 0,
          pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
          fgMade: 0, fgAtt: 0,
          fg3Made: 0, fg3Att: 0,
          ftMade: 0, ftAtt: 0,
          min: 0, to: 0, pf: 0,
        })
      }
      const acc = accumMap.get(key)!
      acc.games += 1
      acc.pts += p.pts
      acc.reb += p.reb
      acc.ast += p.ast
      acc.stl += p.stl
      acc.blk += p.blk
      acc.min += p.min
      acc.to += p.to
      acc.pf += p.pf

      const fgParts = p.fg.split('-')
      acc.fgMade += parseInt(fgParts[0]) || 0
      acc.fgAtt  += parseInt(fgParts[1]) || 0
      const fg3Parts = p.fg3.split('-')
      acc.fg3Made += parseInt(fg3Parts[0]) || 0
      acc.fg3Att  += parseInt(fg3Parts[1]) || 0
      const ftParts = p.ft.split('-')
      acc.ftMade += parseInt(ftParts[0]) || 0
      acc.ftAtt  += parseInt(ftParts[1]) || 0
    }
  }

  // 5. Compute averages and filter
  const averages: ESPNPlayerAverage[] = Array.from(accumMap.values())
    .filter(a => a.games >= 1 && a.pts > 0)
    .map(a => ({
      playerId: a.espnId || a.displayName,
      espnId: a.espnId,
      displayName: a.displayName,
      teamAbbr: a.teamAbbr,
      gamesPlayed: a.games,
      pts:    a.pts / a.games,
      reb:    a.reb / a.games,
      ast:    a.ast / a.games,
      stl:    a.stl / a.games,
      blk:    a.blk / a.games,
      min:    a.min / a.games,
      fgPct:  a.fgAtt  > 0 ? a.fgMade  / a.fgAtt  : 0,
      fg3Pct: a.fg3Att > 0 ? a.fg3Made / a.fg3Att : 0,
      ftPct:  a.ftAtt  > 0 ? a.ftMade  / a.ftAtt  : 0,
    }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 10)

  return averages
}

// Récupère les stats saison régulière via ESPN core API
export async function getPlayerRegularSeasonStats(espnId: string): Promise<ESPNRegularSeasonStats | null> {
  if (!espnId) return null
  try {
    const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/2026/types/2/athletes/${espnId}/statistics/0`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats: any[] = data.splits?.stats ?? data.categories?.[0]?.stats ?? []
    if (stats.length === 0) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const find = (names: string[]): number => {
      for (const name of names) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = stats.find((s: any) => s.name === name || s.abbreviation === name)
        if (s) return parseFloat(String(s.value ?? s.displayValue)) || 0
      }
      return 0
    }

    const pts = find(['avgPoints', 'pointsPerGame', 'PTS'])
    if (pts === 0) return null

    return {
      pts,
      reb: find(['avgRebounds', 'avgTotalRebounds', 'reboundsPerGame', 'REB']),
      ast: find(['avgAssists', 'assistsPerGame', 'AST']),
      gamesPlayed: find(['gamesPlayed', 'GP']),
    }
  } catch {
    return null
  }
}

export async function getMatchupPlayerAverages(
  team1Abbr: string,
  team2Abbr: string
): Promise<{ team1: ESPNPlayerAverage[]; team2: ESPNPlayerAverage[] }> {
  const [team1, team2] = await Promise.all([
    getTeamPlayoffPlayerAverages(team1Abbr),
    getTeamPlayoffPlayerAverages(team2Abbr),
  ])
  return { team1, team2 }
}

// =============================================
// TENNIS — Résultats (Roland Garros, Wimbledon…)
// =============================================

export type ESPNTennisResult = {
  player1:    string  // ESPN displayName
  player2:    string
  winnerName: string  // ESPN displayName du gagnant
  date:       string  // ISO datetime
}

// Les matchs tennis ESPN sont dans ev.groupings[].competitions[] (pas ev.competitions[])
// Le statut est comp.status.completed (pas comp.status.type.completed comme pour les sports d'équipe)
async function fetchESPNTournamentResults(tour: 'atp' | 'wta'): Promise<ESPNTennisResult[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/tennis/${tour}/scoreboard`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    const results: ESPNTennisResult[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const ev of (data.events ?? []) as any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const g of (ev.groupings ?? []) as any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const comp of (g.competitions ?? []) as any[]) {
          if (!comp.status?.completed) continue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const competitors: any[] = comp.competitors ?? []
          if (competitors.length < 2) continue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const winnerComp = competitors.find((c: any) => c.winner === true)
          if (!winnerComp) continue
          const p1: string = competitors[0]?.athlete?.displayName ?? ''
          const p2: string = competitors[1]?.athlete?.displayName ?? ''
          const winnerName: string = winnerComp.athlete?.displayName ?? ''
          if (p1 && p2 && winnerName) results.push({ player1: p1, player2: p2, winnerName, date: comp.date ?? '' })
        }
      }
    }
    return results
  } catch { return [] }
}

// Retourne tous les matchs terminés du tournoi en cours (ATP + WTA) — 2 requêtes seulement
export async function getESPNTennisResults(): Promise<ESPNTennisResult[]> {
  const [atp, wta] = await Promise.all([
    fetchESPNTournamentResults('atp'),
    fetchESPNTournamentResults('wta'),
  ])
  return [...atp, ...wta]
}

// =============================================
// WORLD CUP / CdM FUNCTIONS
// =============================================

export async function getCdMUpcomingWithOdds(limitDays = 14): Promise<ESPNCdMOdds[]> {
  try {
    // 1. Get upcoming CdM events
    const sbRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
      { cache: 'no-store' }
    )
    if (!sbRes.ok) return []
    const sbData = await sbRes.json()
    const events = sbData.events ?? []

    const now = new Date()
    const limitDate = new Date(now)
    limitDate.setDate(now.getDate() + limitDays)

    // Filter upcoming events within limitDays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upcoming = events.filter((ev: any) => {
      const status = ev.status?.type?.name ?? ''
      const isFinal = status === 'STATUS_FINAL' || ev.status?.type?.completed === true
      if (isFinal) return false
      const evDate = new Date(ev.date ?? '')
      return evDate >= now && evDate <= limitDate
    }).slice(0, 8)

    if (upcoming.length === 0) return []

    // 2. Fetch summaries in parallel
    const summaries = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upcoming.map(async (ev: any) => {
        try {
          const res = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${ev.id}`,
            { cache: 'no-store' }
          )
          if (!res.ok) return null
          return { id: ev.id, date: ev.date, data: await res.json() }
        } catch {
          return null
        }
      })
    )

    // 3. Extract odds and team info
    const results: ESPNCdMOdds[] = []
    for (const s of summaries) {
      if (!s) continue
      const { id, date, data } = s
      const comps = data.header?.competitions?.[0]?.competitors ?? []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const homeComp = comps.find((c: any) => c.homeAway === 'home')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awayComp = comps.find((c: any) => c.homeAway === 'away')

      const homeTeam = homeComp?.team?.abbreviation ?? ''
      const awayTeam = awayComp?.team?.abbreviation ?? ''
      const homeDisplayName = homeComp?.team?.displayName ?? homeTeam
      const awayDisplayName = awayComp?.team?.displayName ?? awayTeam

      const oddsArr = data.odds ?? []
      const oddsEntry = oddsArr[0] ?? null

      const hasOdds = !!oddsEntry
      const spread      = oddsEntry?.details    ?? ''
      const overUnder   = oddsEntry?.overUnder  ?? 0
      const homeMoneyLine = oddsEntry?.homeTeamOdds?.moneyLine ?? 0
      const awayMoneyLine = oddsEntry?.awayTeamOdds?.moneyLine ?? 0

      results.push({
        eventId: id,
        homeTeam,
        awayTeam,
        homeDisplayName,
        awayDisplayName,
        date,
        spread,
        overUnder,
        homeMoneyLine,
        awayMoneyLine,
        hasOdds,
      })
    }

    return results
  } catch {
    return []
  }
}
