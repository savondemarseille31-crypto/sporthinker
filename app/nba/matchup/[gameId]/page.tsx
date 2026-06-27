import Link from 'next/link'
import Header from '@/components/Header'
import { notFound } from 'next/navigation'
import { getEntitlement } from '@/lib/entitlement'
import { PaywallPage } from '@/components/PremiumLock'
import {
  getTodayPlayoffGames,
  getSeriesGames,
  formatGameStatus,
  computeSeriesScore,
  NBA_TEAMS,
  type NBAGame,
} from '@/lib/nba-api'
import {
  getNBAPlayoffEventIds,
  getNBAGameBoxScore,
  getMatchupPlayerAverages,
  getPlayerRegularSeasonStats,
  toESPNTeamAbbr,
  type ESPNPlayerAverage,
  type ESPNRegularSeasonStats,
} from '@/lib/espn-api'

export const revalidate = 60 // 1 min — boxscore + stats matchup live

// ---- Helpers ----
function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-gray-800'}`}>
      <p className={`text-base font-bold ${highlight ? 'text-violet-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function fmt(v: number, decimals = 1): string {
  return v.toFixed(decimals)
}

// ---- Prop Signal Types ----
type PlayerTrend = { pts?: number; reb?: number; ast?: number }
type RegSeasonMap = Map<string, ESPNRegularSeasonStats>

type PropSignal = {
  playerName: string
  teamAbbr: string
  stat: 'PTS' | 'REB' | 'AST'
  direction: 'OVER' | 'UNDER'
  seasonAvg: number
  recentAvg: number
  trendValue: number
  force: 'fort' | 'modéré'
}

function generatePropSignals(
  players: ESPNPlayerAverage[],
  teamAbbr: string,
  getTrend: (p: ESPNPlayerAverage) => PlayerTrend
): PropSignal[] {
  const signals: PropSignal[] = []

  for (const player of players.slice(0, 5)) {
    const trend = getTrend(player)

    // PTS — seuil 2.5 pts
    if (trend.pts != null && Math.abs(trend.pts) >= 2.5) {
      signals.push({
        playerName: player.displayName,
        teamAbbr,
        stat: 'PTS',
        direction: trend.pts > 0 ? 'OVER' : 'UNDER',
        seasonAvg: player.pts,
        recentAvg: player.pts + trend.pts,
        trendValue: trend.pts,
        force: Math.abs(trend.pts) >= 4 ? 'fort' : 'modéré',
      })
    }

    // REB — seuil 1.5
    if (trend.reb != null && Math.abs(trend.reb) >= 1.5) {
      signals.push({
        playerName: player.displayName,
        teamAbbr,
        stat: 'REB',
        direction: trend.reb > 0 ? 'OVER' : 'UNDER',
        seasonAvg: player.reb,
        recentAvg: player.reb + trend.reb,
        trendValue: trend.reb,
        force: Math.abs(trend.reb) >= 2.5 ? 'fort' : 'modéré',
      })
    }

    // AST — seuil 1.5
    if (trend.ast != null && Math.abs(trend.ast) >= 1.5) {
      signals.push({
        playerName: player.displayName,
        teamAbbr,
        stat: 'AST',
        direction: trend.ast > 0 ? 'OVER' : 'UNDER',
        seasonAvg: player.ast,
        recentAvg: player.ast + trend.ast,
        trendValue: trend.ast,
        force: Math.abs(trend.ast) >= 2.5 ? 'fort' : 'modéré',
      })
    }
  }

  return signals.sort((a, b) => {
    if (a.force === 'fort' && b.force !== 'fort') return -1
    if (b.force === 'fort' && a.force !== 'fort') return 1
    return Math.abs(b.trendValue) - Math.abs(a.trendValue)
  })
}

// ---- ESPN Player Row (grid layout) ----
// Colonnes: [#] [Nom] [PO PTS] [PO REB] [PO AST] [FG%] [Saison PTS]
const PLAYER_GRID = 'grid grid-cols-[20px_1fr_44px_40px_40px] sm:grid-cols-[20px_1fr_44px_40px_40px_48px_72px] items-center gap-x-2'

function PlayerTableHeader() {
  return (
    <div className={`${PLAYER_GRID} text-xs text-gray-600 pb-2 border-b border-[#262b36] mb-1`}>
      <span></span>
      <span>Joueur</span>
      <span className="text-right">PTS</span>
      <span className="text-right">REB</span>
      <span className="text-right">AST</span>
      <span className="text-right hidden sm:block">FG%</span>
      <span className="text-right hidden sm:block text-gray-500">Saison</span>
    </div>
  )
}

function ESPNPlayerRow({
  player,
  rank,
  trend,
  regSeason,
}: {
  player: ESPNPlayerAverage
  rank: number
  trend?: PlayerTrend
  regSeason?: ESPNRegularSeasonStats | null
}) {
  const trendPts = trend?.pts
  const trendColor =
    trendPts == null ? 'text-gray-600'
    : trendPts > 2 ? 'text-violet-400'
    : trendPts < -2 ? 'text-red-400'
    : 'text-gray-400'

  // Comparaison saison régulière : différence pts playoffs vs saison
  const regDiff = regSeason ? player.pts - regSeason.pts : null
  const regDiffColor = regDiff == null ? ''
    : regDiff > 2 ? 'text-violet-400'
    : regDiff < -2 ? 'text-red-400'
    : 'text-gray-400'

  return (
    <div className={`${PLAYER_GRID} py-2.5 border-b border-[#262b36] last:border-0 text-xs`}>
      <span className="text-gray-600">{rank}</span>
      <span className="text-sm font-medium text-white truncate">{player.displayName}</span>
      <span className="text-right font-bold text-white">{fmt(player.pts)}</span>
      <span className="text-right text-gray-400">{fmt(player.reb)}</span>
      <span className="text-right text-gray-400">{fmt(player.ast)}</span>
      <span className="text-right text-gray-500 hidden sm:block">{fmt(player.fgPct * 100)}%</span>
      <span className={`text-right hidden sm:flex sm:flex-col sm:items-end gap-0.5`}>
        {regSeason ? (
          <>
            <span className="text-gray-500">{fmt(regSeason.pts)}</span>
            <span className={`text-[10px] font-semibold ${regDiffColor}`}>
              {regDiff != null && regDiff !== 0 ? `${regDiff > 0 ? '+' : ''}${fmt(regDiff)}` : '='}
            </span>
          </>
        ) : (
          <span className="text-gray-700">—</span>
        )}
      </span>
    </div>
  )
}

// ---- NBA Team Signal ----
type NBASignal = {
  pari: string
  typePari: string
  force: 'fort' | 'modéré' | 'à surveiller'
  raisonnement: string
}

function generateNBASignal(
  seriesGames: NBAGame[],
  homeTeamId: number,
  awayTeamId: number,
  homeTeamFullName: string,
  awayTeamFullName: string,
  homeHasCourtAdvantage: boolean,
  espnSeriesSummary?: string
): NBASignal | null {
  const finalGames = seriesGames.filter(g => g.status === 'Final')
  if (finalGames.length === 0) return null

  const { team1Wins: homeWins, team2Wins: awayWins } = computeSeriesScore(seriesGames, homeTeamId, awayTeamId)

  const homeInfo = NBA_TEAMS[homeTeamId]
  const awayInfo = NBA_TEAMS[awayTeamId]
  const homeName = homeInfo?.shortName ?? homeTeamFullName
  const awayName = awayInfo?.shortName ?? awayTeamFullName

  if (espnSeriesSummary && (espnSeriesSummary.includes('wins series') || espnSeriesSummary.includes('gagne'))) {
    return null
  }

  const totals = finalGames.map(g => g.home_team_score + g.visitor_team_score)
  const seriesAvgTotal = totals.reduce((s, t) => s + t, 0) / totals.length

  let homePts = 0, awayPts = 0, homeGames = 0, awayGames = 0
  for (const g of finalGames) {
    if (g.home_team.id === homeTeamId) {
      homePts += g.home_team_score; homeGames++
      awayPts += g.visitor_team_score; awayGames++
    } else {
      homePts += g.visitor_team_score; homeGames++
      awayPts += g.home_team_score; awayGames++
    }
  }
  const homePPG = homeGames > 0 ? homePts / homeGames : 0
  const awayPPG = awayGames > 0 ? awayPts / awayGames : 0

  if (seriesAvgTotal > 228) {
    return {
      pari: `OVER ~${seriesAvgTotal.toFixed(0)} pts`,
      typePari: 'Total',
      force: 'modéré',
      raisonnement: `Moyenne de ${seriesAvgTotal.toFixed(1)} pts/match dans cette série (${finalGames.length} matchs). Tendance offensive marquée.`,
    }
  }

  if (seriesAvgTotal < 210) {
    return {
      pari: `UNDER ~${seriesAvgTotal.toFixed(0)} pts`,
      typePari: 'Total',
      force: 'modéré',
      raisonnement: `Série défensive avec seulement ${seriesAvgTotal.toFixed(1)} pts/match en moyenne (${finalGames.length} matchs).`,
    }
  }

  const leaderWins = Math.max(homeWins, awayWins)
  const trailerWins = Math.min(homeWins, awayWins)
  const leaderName = homeWins >= awayWins ? homeName : awayName

  if (leaderWins >= 3 && trailerWins <= 1) {
    const force: 'fort' | 'modéré' = leaderWins === 3 && trailerWins === 0 ? 'fort' : 'modéré'
    return {
      pari: `Moneyline ${leaderName}`,
      typePari: 'Moneyline',
      force,
      raisonnement: `${leaderName} mène ${leaderWins}-${trailerWins} dans la série. Dominance claire sur l'ensemble des matchs.`,
    }
  }

  if (leaderWins >= 2 && homeHasCourtAdvantage) {
    const leaderIsHome = (homeWins > awayWins)
    if (leaderIsHome) {
      return {
        pari: `Moneyline ${homeName}`,
        typePari: 'Moneyline',
        force: 'modéré',
        raisonnement: `${homeName} mène ${homeWins}-${awayWins} et joue à domicile ce soir. Double avantage.`,
      }
    }
  }

  if (homeWins === awayWins && homePPG > awayPPG + 5) {
    return {
      pari: `Double chance ${homeName}`,
      typePari: 'Double chance',
      force: 'à surveiller',
      raisonnement: `Série équilibrée (${homeWins}-${awayWins}) mais ${homeName} marque plus (${homePPG.toFixed(1)} vs ${awayPPG.toFixed(1)} pts/match) et joue à domicile.`,
    }
  }

  return null
}

async function findGame(gameId: number): Promise<NBAGame | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const todayGames = await getTodayPlayoffGames(today)
    const found = todayGames.find(g => g.id === gameId)
    if (found) return found

    const dates = [-1, 1, -2, 2].map(offset => {
      const d = new Date()
      d.setDate(d.getDate() + offset)
      return d.toISOString().split('T')[0]
    })
    for (const date of dates) {
      const games = await getTodayPlayoffGames(date)
      const g = games.find(g => g.id === gameId)
      if (g) return g
    }
    return null
  } catch {
    return null
  }
}

function bdlAbbrToESPN(abbr: string): string {
  return toESPNTeamAbbr(abbr)
}

// ---- Page ----
export default async function NBAMatchupPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { premium } = await getEntitlement()
  if (!premium) return <PaywallPage title="Analyse du match réservée aux abonnés" />
  const { gameId: gameIdStr } = await params
  const gameId = parseInt(gameIdStr)
  if (isNaN(gameId)) notFound()

  const game = await findGame(gameId)
  if (!game) notFound()

  const homeTeamId = game.home_team.id
  const awayTeamId = game.visitor_team.id
  const homeAbbr = bdlAbbrToESPN(game.home_team.abbreviation)
  const awayAbbr = bdlAbbrToESPN(game.visitor_team.abbreviation)

  const [seriesGames, espnMatchup, espnEvents] = await Promise.all([
    getSeriesGames(homeTeamId, awayTeamId),
    getMatchupPlayerAverages(homeAbbr, awayAbbr),
    getNBAPlayoffEventIds(),
  ])

  const seriesESPNEvents = espnEvents.filter(
    e =>
      (e.home === homeAbbr && e.away === awayAbbr) ||
      (e.home === awayAbbr && e.away === homeAbbr)
  ).slice(-3)

  const recentBoxScores = await Promise.all(
    seriesESPNEvents.map(e => getNBAGameBoxScore(e.id))
  )

  const espnSeriesSummary = recentBoxScores.find(b => b?.seriesSummary)?.seriesSummary

  // Compute multi-stat trend for a player (last-3-series avg vs season playoff avg)
  function computeTrend(player: ESPNPlayerAverage, teamAbbr: string): PlayerTrend {
    const gamePts: number[] = []
    const gameReb: number[] = []
    const gameAst: number[] = []

    for (const box of recentBoxScores) {
      if (!box) continue
      const teamBox = box.homeTeam.teamAbbr === teamAbbr ? box.homeTeam : box.awayTeam
      if (teamBox.teamAbbr !== teamAbbr) continue
      const p = teamBox.players.find(pl => pl.displayName === player.displayName)
      if (p) {
        gamePts.push(p.pts)
        gameReb.push(p.reb)
        gameAst.push(p.ast)
      }
    }

    if (gamePts.length === 0) return {}
    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length
    return {
      pts: avg(gamePts) - player.pts,
      reb: avg(gameReb) - player.reb,
      ast: avg(gameAst) - player.ast,
    }
  }

  const homePlayers = espnMatchup.team1.slice(0, 5)
  const awayPlayers = espnMatchup.team2.slice(0, 5)

  // Compute trends for all players (used both for table display and prop signals)
  const homePlayerTrends = homePlayers.map(p => computeTrend(p, homeAbbr))
  const awayPlayerTrends = awayPlayers.map(p => computeTrend(p, awayAbbr))

  // Fetch regular season stats for top 5 players per team (best-effort, fails silently)
  const allTopPlayers = [...homePlayers, ...awayPlayers]
  const regSeasonResults = await Promise.all(
    allTopPlayers.map(p => p.espnId ? getPlayerRegularSeasonStats(p.espnId).catch(() => null) : Promise.resolve(null))
  )
  const regSeasonMap: RegSeasonMap = new Map()
  allTopPlayers.forEach((p, i) => {
    if (regSeasonResults[i]) regSeasonMap.set(p.espnId || p.displayName, regSeasonResults[i]!)
  })

  // Generate prop signals from trends
  const homePropSignals = generatePropSignals(homePlayers, homeAbbr, p => computeTrend(p, homeAbbr))
  const awayPropSignals = generatePropSignals(awayPlayers, awayAbbr, p => computeTrend(p, awayAbbr))
  const allPropSignals = [...homePropSignals, ...awayPropSignals].sort((a, b) => {
    if (a.force === 'fort' && b.force !== 'fort') return -1
    if (b.force === 'fort' && a.force !== 'fort') return 1
    return Math.abs(b.trendValue) - Math.abs(a.trendValue)
  })

  const { team1Wins: homeWins, team2Wins: awayWins } = computeSeriesScore(seriesGames, homeTeamId, awayTeamId)

  const homeInfo = NBA_TEAMS[homeTeamId]
  const awayInfo = NBA_TEAMS[awayTeamId]
  const statusStr = formatGameStatus(game)
  const isFinal = game.status === 'Final'

  const finalGames = seriesGames.filter(g => g.status === 'Final')
  const totals = finalGames.map(g => g.home_team_score + g.visitor_team_score)
  const seriesAvgTotal = totals.length > 0 ? totals.reduce((s, t) => s + t, 0) / totals.length : null

  let seriesHeader = ''
  if (espnSeriesSummary) {
    seriesHeader = espnSeriesSummary
  } else if (homeWins === awayWins) {
    seriesHeader = `Série à égalité ${homeWins}-${awayWins}`
  } else if (homeWins > awayWins) {
    seriesHeader = `${homeInfo?.shortName ?? game.home_team.abbreviation} mène ${homeWins}-${awayWins}`
    if (homeWins === 4) seriesHeader += ' — Série terminée'
  } else {
    seriesHeader = `${awayInfo?.shortName ?? game.visitor_team.abbreviation} mène ${awayWins}-${homeWins}`
    if (awayWins === 4) seriesHeader += ' — Série terminée'
  }

  const signal = generateNBASignal(
    seriesGames,
    homeTeamId,
    awayTeamId,
    game.home_team.full_name,
    game.visitor_team.full_name,
    true,
    espnSeriesSummary
  )

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/nba" className="hover:text-violet-400 transition-colors">🏀 NBA</Link>
          <span>/</span>
          <span className="text-white">
            {game.home_team.abbreviation} vs {game.visitor_team.abbreviation}
          </span>
        </div>

        {/* Header match */}
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            {isFinal ? (
              <span className="text-sm bg-gray-700 text-gray-400 px-3 py-1 rounded-full">Final</span>
            ) : (
              <span className="text-sm text-gray-500">🕐 {statusStr}</span>
            )}
            <span className="text-sm text-violet-400 font-semibold">{seriesHeader}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Visiteur */}
            <div className="text-center">
              <p className="text-4xl mb-2">{awayInfo?.emoji ?? '🏀'}</p>
              <p className={`text-xl font-bold ${awayInfo?.color ?? 'text-white'}`}>
                {awayInfo?.shortName ?? game.visitor_team.abbreviation}
              </p>
              <p className="text-xs text-gray-500">{game.visitor_team.full_name}</p>
              {isFinal && (
                <p className={`text-3xl font-bold mt-2 ${game.visitor_team_score > game.home_team_score ? 'text-violet-400' : 'text-white'}`}>
                  {game.visitor_team_score}
                </p>
              )}
            </div>

            {/* Centre */}
            <div className="text-center">
              <p className="text-gray-600 text-2xl font-light">@</p>
              <p className="text-xs text-gray-600 mt-1">Ext. · Dom.</p>
              {seriesAvgTotal && (
                <p className="text-xs text-gray-500 mt-2">
                  Moy. série: <span className="text-white font-semibold">{seriesAvgTotal.toFixed(0)}</span> pts
                </p>
              )}
            </div>

            {/* Domicile */}
            <div className="text-center">
              <p className="text-4xl mb-2">{homeInfo?.emoji ?? '🏀'}</p>
              <p className={`text-xl font-bold ${homeInfo?.color ?? 'text-white'}`}>
                {homeInfo?.shortName ?? game.home_team.abbreviation}
              </p>
              <p className="text-xs text-gray-500">{game.home_team.full_name}</p>
              {isFinal && (
                <p className={`text-3xl font-bold mt-2 ${game.home_team_score > game.visitor_team_score ? 'text-violet-400' : 'text-white'}`}>
                  {game.home_team_score}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Signal équipe */}
        {signal ? (
          <div className={`rounded-2xl p-5 mb-6 border ${
            signal.force === 'fort' ? 'bg-violet-500/10 border-violet-500/30' :
            signal.force === 'modéré' ? 'bg-yellow-500/10 border-yellow-500/30' :
            'bg-[#14171f] border-gray-700'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-sm">
                {signal.force === 'fort' ? '⚡ Signal fort' : signal.force === 'modéré' ? '🔶 Signal modéré' : '👁 À surveiller'}
              </span>
              <span className="text-xs text-gray-500">— {signal.typePari}</span>
            </div>
            <p className={`text-xl font-bold mb-2 ${
              signal.force === 'fort' ? 'text-violet-400' :
              signal.force === 'modéré' ? 'text-yellow-400' : 'text-gray-300'
            }`}>{signal.pari}</p>
            <p className="text-sm text-gray-400 mb-4">{signal.raisonnement}</p>
            <Link
              href="/paris/calculateur"
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              💰 Calculer la value →
            </Link>
          </div>
        ) : (
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 mb-6 text-center text-sm text-gray-500">
            Pas assez de données de série pour générer un signal équipe.
          </div>
        )}

        {/* Signaux Props Joueurs */}
        {allPropSignals.length > 0 ? (
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 mb-6">
            <h2 className="text-base font-bold text-violet-400 mb-1">🎯 Signaux Props Joueurs</h2>
            <p className="text-xs text-gray-600 mb-4">
              Basés sur les 3 derniers matchs de série vs moyenne playoffs · Seuil : ±2.5 pts / ±1.5 reb-ast
            </p>
            <div className="space-y-3">
              {allPropSignals.map((s, i) => {
                const isFort = s.force === 'fort'
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                      isFort
                        ? 'bg-violet-500/10 border-violet-500/30'
                        : 'bg-yellow-500/5 border-yellow-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        s.direction === 'OVER'
                          ? 'bg-violet-500/20 text-violet-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {s.direction}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.playerName}</p>
                        <p className="text-xs text-gray-500">
                          {s.stat} · {s.teamAbbr} ·{' '}
                          Moy. saison <span className="text-white">{fmt(s.seasonAvg)}</span>
                          {' '}→ récent <span className={s.direction === 'OVER' ? 'text-emerald-400' : 'text-red-400'}>{fmt(s.recentAvg)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-bold ${s.trendValue > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s.trendValue > 0 ? '+' : ''}{fmt(s.trendValue)}
                      </p>
                      <p className={`text-xs ${isFort ? 'text-violet-500' : 'text-yellow-500'}`}>
                        {isFort ? '⚡ fort' : '🔶 modéré'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-600 mt-4">
              💡 Comparer ces lignes avec les props proposés par ton bookmaker. Une tendance forte + ligne inférieure = value.
            </p>
          </section>
        ) : (
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 mb-6 text-sm text-gray-500 text-center">
            Pas encore de signaux props — données insuffisantes (moins de 2 matchs de série joués).
          </div>
        )}

        {/* Top joueurs ESPN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Visiteur */}
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
            <h2 className="text-base font-bold mb-0.5">
              {awayInfo?.emoji} {awayAbbr} — Top joueurs playoffs
            </h2>
            <p className="text-xs text-gray-600 mb-4">Source ESPN · Moyennes playoffs</p>
            <PlayerTableHeader />
            {awayPlayers.length === 0 ? (
              <p className="text-gray-600 text-sm py-4">Stats non disponibles</p>
            ) : (
              awayPlayers.map((p, i) => (
                <ESPNPlayerRow
                  key={p.playerId}
                  player={p}
                  rank={i + 1}
                  trend={awayPlayerTrends[i]}
                  regSeason={regSeasonMap.get(p.espnId || p.displayName)}
                />
              ))
            )}
          </section>

          {/* Domicile */}
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
            <h2 className="text-base font-bold mb-0.5">
              {homeInfo?.emoji} {homeAbbr} — Top joueurs playoffs
            </h2>
            <p className="text-xs text-gray-600 mb-4">Source ESPN · Moyennes playoffs</p>
            <PlayerTableHeader />
            {homePlayers.length === 0 ? (
              <p className="text-gray-600 text-sm py-4">Stats non disponibles</p>
            ) : (
              homePlayers.map((p, i) => (
                <ESPNPlayerRow
                  key={p.playerId}
                  player={p}
                  rank={i + 1}
                  trend={homePlayerTrends[i]}
                  regSeason={regSeasonMap.get(p.espnId || p.displayName)}
                />
              ))
            )}
          </section>

        </div>

        {/* Légende */}
        <div className="mb-6 bg-[#14171f] border border-[#262b36] rounded-xl px-4 py-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
          <span>PTS · REB · AST = moyennes playoffs ESPN</span>
          <span><span className="text-gray-400 font-semibold">Saison</span> = moy. saison régulière · delta en-dessous</span>
          <span><span className="text-violet-400 font-semibold">+X.X</span> = meilleur en playoffs vs saison</span>
          <span><span className="text-red-400 font-semibold">−X.X</span> = moins bon en playoffs vs saison</span>
        </div>

        {/* Historique de la série */}
        <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 mb-6">
          <h2 className="text-base font-bold text-violet-400 mb-4">
            ⚔️ Matchs de la série ({finalGames.length} joués)
          </h2>

          {finalGames.length === 0 ? (
            <p className="text-gray-600 text-sm">Aucun match joué encore</p>
          ) : (
            <div className="space-y-2">
              {seriesGames.map((g, i) => {
                const isCurrentGame = g.id === gameId
                const gIsFinal = g.status === 'Final'
                const homeWon = g.home_team_score > g.visitor_team_score
                const winnerName = homeWon
                  ? (NBA_TEAMS[g.home_team.id]?.shortName ?? g.home_team.abbreviation)
                  : (NBA_TEAMS[g.visitor_team.id]?.shortName ?? g.visitor_team.abbreviation)

                return (
                  <div
                    key={g.id}
                    className={`flex items-center justify-between text-sm rounded-xl px-4 py-2.5 ${
                      isCurrentGame ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-gray-800'
                    }`}
                  >
                    <span className="text-gray-500 text-xs w-8">G{i + 1}</span>
                    <span className="text-gray-500 text-xs w-20">{g.date}</span>
                    <span className="text-gray-400 text-xs">
                      {NBA_TEAMS[g.visitor_team.id]?.shortName ?? g.visitor_team.abbreviation} @{' '}
                      {NBA_TEAMS[g.home_team.id]?.shortName ?? g.home_team.abbreviation}
                    </span>
                    {gIsFinal ? (
                      <>
                        <span className="font-bold text-white">
                          {g.visitor_team_score}–{g.home_team_score}
                        </span>
                        <span className="text-violet-400 text-xs font-semibold">{winnerName}</span>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">{formatGameStatus(g)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {finalGames.length > 0 && seriesAvgTotal && (
            <p className="mt-3 text-xs text-gray-600">
              Total moyen série : <span className="text-white">{seriesAvgTotal.toFixed(1)}</span> pts ·
              {' '}{finalGames.length} matchs joués
            </p>
          )}
        </section>

        {/* Stats de série */}
        {finalGames.length > 0 && (
          <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 mb-6">
            <h2 className="text-base font-bold text-violet-400 mb-4">📊 Stats de la série</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Matchs joués" value={String(finalGames.length)} />
              <StatBox
                label="Total moyen"
                value={seriesAvgTotal ? seriesAvgTotal.toFixed(1) : '—'}
                highlight={(seriesAvgTotal ?? 0) > 220}
              />
              <StatBox
                label={`Score ${homeInfo?.shortName ?? 'DOM'}`}
                value={String(homeWins)}
                highlight={homeWins > awayWins}
              />
              <StatBox
                label={`Score ${awayInfo?.shortName ?? 'EXT'}`}
                value={String(awayWins)}
                highlight={awayWins > homeWins}
              />
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/paris/calculateur"
            className="flex-1 bg-violet-500 hover:bg-violet-400 text-black font-bold text-center py-3 rounded-xl transition-colors"
          >
            💰 Calculateur de value
          </Link>
          <Link
            href="/signaux"
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center py-3 rounded-xl transition-colors"
          >
            ⚡ Tous les signaux
          </Link>
        </div>
      </div>
    </main>
  )
}
