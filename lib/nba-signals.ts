import {
  getTodayPlayoffGames,
  getSeriesGames,
  computeSeriesScore,
  formatGameStatus,
  NBA_TEAMS,
} from './nba-api'
import type { Signal, SignalForce } from './signals'

export async function generateNBASignalsForToday(date?: string): Promise<Signal[]> {
  const today = date ?? new Date().toISOString().split('T')[0]

  let games
  try {
    games = await getTodayPlayoffGames(today)
  } catch {
    return []
  }

  if (games.length === 0) return []

  const results = await Promise.all(
    games.map(async (game) => {
      try {
        const homeTeamId = game.home_team.id
        const awayTeamId = game.visitor_team.id
        const homeInfo = NBA_TEAMS[homeTeamId]
        const awayInfo = NBA_TEAMS[awayTeamId]
        const homeName = game.home_team.full_name ?? homeInfo?.shortName ?? game.home_team.abbreviation
        const awayName = game.visitor_team.full_name ?? awayInfo?.shortName ?? game.visitor_team.abbreviation
        const matchStr = `${homeName} vs ${awayName}`
        const heureStr = game.status === 'Final' ? 'Final' : formatGameStatus(game)

        const seriesGames = await getSeriesGames(homeTeamId, awayTeamId)
        const finalGames = seriesGames.filter(g => g.status === 'Final')
        if (finalGames.length < 2) return null   // besoin d'au moins 2 matchs pour un signal fiable

        const { team1Wins: homeWins, team2Wins: awayWins } = computeSeriesScore(seriesGames, homeTeamId, awayTeamId)

        const totals = finalGames.map(g => g.home_team_score + g.visitor_team_score)
        const seriesAvgTotal = totals.reduce((s, t) => s + t, 0) / totals.length
        const leaderWins = Math.max(homeWins, awayWins)
        const trailerWins = Math.min(homeWins, awayWins)
        const leaderName = homeWins >= awayWins ? homeName : awayName

        const base = {
          sport: 'NBA' as const,
          match: matchStr,
          flagDom: homeInfo?.emoji ?? '🏀',
          flagExt: awayInfo?.emoji ?? '🏀',
          date: game.date,
          heure: heureStr,
          lienCalculateur: `/nba/matchup/${game.id}`,
        }

        // ---- Série très offensive → OVER ----
        if (seriesAvgTotal > 228) {
          return {
            ...base,
            id: `nba-${game.id}-over`,
            force: (seriesAvgTotal > 235 ? 'fort' : 'modéré') as SignalForce,
            typePari: 'Over (Total)',
            pari: `OVER ~${seriesAvgTotal.toFixed(0)} pts`,
            raisonnement: `Série très offensive : ${seriesAvgTotal.toFixed(1)} pts/match de moyenne sur ${finalGames.length} matchs. Le rythme offensif est soutenu des deux côtés.`,
            stats: [
              { label: 'Moy. série', val: seriesAvgTotal.toFixed(1), highlight: true },
              { label: 'Matchs joués', val: String(finalGames.length) },
              { label: homeName, val: String(homeWins), highlight: homeWins > awayWins },
              { label: awayName, val: String(awayWins), highlight: awayWins > homeWins },
            ],
          } as Signal
        }

        // ---- Série défensive → UNDER ----
        if (seriesAvgTotal < 210) {
          return {
            ...base,
            id: `nba-${game.id}-under`,
            force: (seriesAvgTotal < 200 ? 'fort' : 'modéré') as SignalForce,
            typePari: 'Under (Total)',
            pari: `UNDER ~${seriesAvgTotal.toFixed(0)} pts`,
            raisonnement: `Série défensive : seulement ${seriesAvgTotal.toFixed(1)} pts/match en moyenne sur ${finalGames.length} matchs. Les défenses prennent le dessus dans cette série.`,
            stats: [
              { label: 'Moy. série', val: seriesAvgTotal.toFixed(1), highlight: true },
              { label: 'Matchs joués', val: String(finalGames.length) },
              { label: homeName, val: String(homeWins), highlight: homeWins > awayWins },
              { label: awayName, val: String(awayWins), highlight: awayWins > homeWins },
            ],
          } as Signal
        }

        // ---- Leader dominant dans la série → Moneyline ----
        if (leaderWins >= 3 && trailerWins <= 1) {
          const force: SignalForce = leaderWins === 3 && trailerWins === 0 ? 'fort' : 'modéré'
          return {
            ...base,
            id: `nba-${game.id}-ml`,
            force,
            typePari: 'Moneyline',
            pari: `Moneyline ${leaderName}`,
            raisonnement: `${leaderName} mène ${leaderWins}-${trailerWins} dans la série. Dominance claire sur l'ensemble des matchs joués. Le momentum est de leur côté.`,
            stats: [
              { label: homeName, val: String(homeWins), highlight: homeWins > awayWins },
              { label: awayName, val: String(awayWins), highlight: awayWins > homeWins },
              { label: 'Moy. total', val: seriesAvgTotal.toFixed(1) },
              { label: 'Matchs joués', val: String(finalGames.length) },
            ],
          } as Signal
        }

        return null
      } catch {
        return null
      }
    })
  )

  return results.filter(Boolean) as Signal[]
}
