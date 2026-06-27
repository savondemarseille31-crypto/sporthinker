import Link from 'next/link'
import Header from '@/components/Header'
import {
  getTodayPlayoffGames,
  getSeriesGames,
  seriesScoreLabel,
  formatGameStatus,
  NBA_TEAMS,
  type NBAGame,
} from '@/lib/nba-api'
import { getNBAPlayoffEventIds, getNBAGameBoxScore } from '@/lib/espn-api'

export const revalidate = 120 // 2 min — matchs playoffs du jour

// Map balldontlie abbreviations to ESPN abbreviations
function bdlAbbrToESPN(abbr: string): string {
  const map: Record<string, string> = {
    'PHO': 'PHX',
    'GOS': 'GSW',
    'NOR': 'NOP',
    'SAN': 'SAS',
  }
  return map[abbr] ?? abbr
}

export default async function NBAPage() {
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's games and ESPN events in parallel
  const [games, espnEvents] = await Promise.all([
    getTodayPlayoffGames(today),
    getNBAPlayoffEventIds(),
  ])

  // Fetch series for each game, and try ESPN summary for today's games
  const gamesWithSeries = await Promise.all(
    games.map(async (game) => {
      const homeESPN = bdlAbbrToESPN(game.home_team.abbreviation)
      const awayESPN = bdlAbbrToESPN(game.visitor_team.abbreviation)

      // Get series games from balldontlie
      const seriesGames = await getSeriesGames(game.home_team.id, game.visitor_team.id)
      const seriesLabel = seriesScoreLabel(seriesGames, game.home_team.id, game.visitor_team.id)

      // Find ESPN event for this game (if it's today's game, get box score for series summary)
      const espnEvent = espnEvents.find(
        e =>
          (e.home === homeESPN && e.away === awayESPN) ||
          (e.home === awayESPN && e.away === homeESPN)
      )

      let espnSeriesSummary: string | undefined
      if (espnEvent) {
        try {
          const box = await getNBAGameBoxScore(espnEvent.id)
          espnSeriesSummary = box?.seriesSummary
        } catch {
          // silent fail
        }
      }

      return { game, seriesLabel, espnSeriesSummary }
    })
  )

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">🏀 NBA Playoffs 2026</h1>
          <p className="text-gray-400">Séries en cours · Matchups du jour · Stats joueurs</p>
        </div>

        {/* Matchs du jour */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-violet-400 mb-4">📅 Matchs du jour</h2>

          {gamesWithSeries.length === 0 ? (
            <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-8 text-center text-gray-500">
              Aucun match aujourd&apos;hui
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gamesWithSeries.map(({ game, seriesLabel, espnSeriesSummary }) => (
                <GameCard
                  key={game.id}
                  game={game}
                  seriesLabel={espnSeriesSummary ?? seriesLabel}
                />
              ))}
            </div>
          )}
        </section>

        {/* Raccourcis */}
        <section>
          <h2 className="text-xl font-bold text-violet-400 mb-4">🔗 Explorer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/nba/joueurs"
              className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 hover:border-violet-500 transition-colors text-center"
            >
              <div className="text-3xl mb-3">📊</div>
              <p className="font-semibold">Stats Joueurs</p>
              <p className="text-xs text-gray-500 mt-1">Points, rebonds, passes...</p>
            </Link>
            <Link
              href="/signaux"
              className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 hover:border-violet-500 transition-colors text-center"
            >
              <div className="text-3xl mb-3">⚡</div>
              <p className="font-semibold">Signaux</p>
              <p className="text-xs text-gray-500 mt-1">Props & paris du jour</p>
            </Link>
            <Link
              href="/nba/joueurs"
              className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 hover:border-violet-500 transition-colors text-center"
            >
              <div className="text-3xl mb-3">👤</div>
              <p className="font-semibold">Joueurs</p>
              <p className="text-xs text-gray-500 mt-1">Stats playoffs par joueur</p>
            </Link>
            <Link
              href="/nba/guide"
              className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 hover:border-violet-500 transition-colors text-center"
            >
              <div className="text-3xl mb-3">📖</div>
              <p className="font-semibold">Guide / Bracket</p>
              <p className="text-xs text-gray-500 mt-1">Tableau des séries playoffs</p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

// ---- Composant carte match ----
function GameCard({ game, seriesLabel }: { game: NBAGame; seriesLabel: string }) {
  const homeInfo = NBA_TEAMS[game.home_team.id]
  const awayInfo = NBA_TEAMS[game.visitor_team.id]
  const statusStr = formatGameStatus(game)
  const isFinal = game.status === 'Final'
  const isUpcoming = !isFinal && game.status.includes('T') && game.status.includes('Z')

  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 hover:border-gray-700 transition-colors">
      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        {isFinal ? (
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Final</span>
        ) : isUpcoming ? (
          <span className="text-xs text-gray-500">🕐 {statusStr}</span>
        ) : (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {statusStr}
          </span>
        )}
        <span className="text-xs text-violet-400/80 font-medium">{seriesLabel}</span>
      </div>

      {/* Équipes */}
      <div className="space-y-2 mb-4">
        {/* Domicile en premier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{homeInfo?.emoji ?? '🏀'}</span>
            <span className={`font-bold ${homeInfo?.color ?? 'text-white'}`}>
              {game.home_team.full_name}
            </span>
            <span className="text-xs text-gray-600">(dom.)</span>
          </div>
          {isFinal && (
            <span className={`text-2xl font-bold ${game.home_team_score > game.visitor_team_score ? 'text-violet-400' : 'text-white'}`}>
              {game.home_team_score}
            </span>
          )}
        </div>
        {/* Visiteur */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{awayInfo?.emoji ?? '🏀'}</span>
            <span className={`font-bold ${awayInfo?.color ?? 'text-white'}`}>
              {game.visitor_team.full_name}
            </span>
          </div>
          {isFinal && (
            <span className={`text-2xl font-bold ${game.visitor_team_score > game.home_team_score ? 'text-violet-400' : 'text-white'}`}>
              {game.visitor_team_score}
            </span>
          )}
        </div>
      </div>

      {/* Lien analyse */}
      <Link
        href={`/nba/matchup/${game.id}`}
        className="block text-center text-xs text-gray-500 hover:text-violet-400 transition-colors border border-[#262b36] hover:border-violet-500/50 rounded-lg py-1.5"
      >
        Analyser →
      </Link>
    </div>
  )
}
