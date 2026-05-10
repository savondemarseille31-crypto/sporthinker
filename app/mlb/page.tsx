import Link from 'next/link'
import Header from '@/components/Header'
import { getSchedule, getStandings, getL10, MLB_TEAMS, formatGameTime } from '@/lib/mlb-api'

export const dynamic = 'force-dynamic'

export default async function MLBPage() {
  const [games, standings] = await Promise.all([getSchedule(), getStandings()])

  const alStandings = standings.filter(s => s.league?.id === 103 || s.division?.id <= 204)
  const nlStandings = standings.filter(s => s.league?.id === 104 || s.division?.id > 204)

  // Leaders par division (1er de chaque)
  const leaders = standings.map(div => ({
    div: div.division.name.replace('American League ', 'AL ').replace('National League ', 'NL '),
    team: div.teamRecords[0],
  }))

  const liveGames = games.filter(g => g.status.abstractGameState === 'Live')
  const upcomingGames = games.filter(g => g.status.abstractGameState === 'Preview')
  const finishedGames = games.filter(g => g.status.abstractGameState === 'Final')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">⚾ MLB 2026</h1>
          <p className="text-gray-400">Matchups du jour · Classements · Stats pour le value betting</p>
        </div>

        {/* Raccourcis */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { href: '/mlb/calendrier', icon: '📅', label: 'Calendrier', sub: `${games.length} matchs aujourd'hui` },
            { href: '/mlb/classements', icon: '🏆', label: 'Classements', sub: '6 divisions · 30 équipes' },
            { href: '/mlb/joueurs', icon: '👤', label: 'Joueurs', sub: 'Top lanceurs & frappeurs' },
            { href: '/mlb/guide', icon: '📖', label: 'Guide paris', sub: 'ERA, WHIP, OPS expliqués' },
          ].map(r => (
            <Link key={r.href} href={r.href}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors text-center">
              <div className="text-3xl mb-2">{r.icon}</div>
              <p className="font-semibold">{r.label}</p>
              <p className="text-xs text-gray-500 mt-1">{r.sub}</p>
            </Link>
          ))}
        </div>

        {/* Matchs en direct */}
        {liveGames.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
              En direct ({liveGames.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveGames.map(g => <GameCard key={g.gamePk} game={g} />)}
            </div>
          </section>
        )}

        {/* Matchs à venir aujourd'hui */}
        {upcomingGames.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-emerald-400">📅 Matchups du jour — Lanceurs probables</h2>
              <Link href="/mlb/calendrier" className="text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingGames.map(g => <GameCard key={g.gamePk} game={g} />)}
            </div>
          </section>
        )}

        {/* Résultats du jour */}
        {finishedGames.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-400 mb-3">✅ Résultats du jour</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finishedGames.map(g => <GameCard key={g.gamePk} game={g} />)}
            </div>
          </section>
        )}

        {/* Classements rapides */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-emerald-400">🏆 Leaders des divisions</h2>
            <Link href="/mlb/classements" className="text-sm text-gray-500 hover:text-emerald-400 transition-colors">
              Classement complet →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {leaders.map(({ div, team }) => {
              const info = MLB_TEAMS[team.team.id]
              return (
                <div key={div} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-400 font-bold mb-1">{div}</p>
                  <p className="text-xl mb-1">{info?.emoji ?? '⚾'}</p>
                  <p className="text-xs font-bold text-white">{info?.shortName ?? team.team.abbreviation}</p>
                  <p className="text-xs text-gray-400">{team.wins}-{team.losses}</p>
                  <p className="text-xs text-gray-600">L10: {getL10(team.records)}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

// ---- Composant carte match ----
function GameCard({ game }: { game: import('@/lib/mlb-api').MLBGame }) {
  const { home, away } = game.teams
  const homeInfo = MLB_TEAMS[home.team.id]
  const awayInfo = MLB_TEAMS[away.team.id]
  const isLive = game.status.abstractGameState === 'Live'
  const isFinal = game.status.abstractGameState === 'Final'
  const isPre = game.status.abstractGameState === 'Preview'

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 ${isLive ? 'border-red-500/40' : 'border-gray-800'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {isLive && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {game.linescore?.currentInningOrdinal} {game.linescore?.inningHalf}
          </span>
        )}
        {isFinal && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Final</span>}
        {isPre && (
          <span className="text-xs text-gray-500">
            {formatGameTime(game.gameDate, game.status.startTimeTBD)}
          </span>
        )}
        <span className="text-xs text-gray-600 truncate max-w-[120px]">{game.venue.name}</span>
      </div>

      {/* Teams */}
      <div className="space-y-2 mb-3">
        {[
          { data: away, info: awayInfo, label: 'Ext.' },
          { data: home, info: homeInfo, label: 'Dom.' },
        ].map(({ data, info, label }) => (
          <div key={data.team.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{info?.emoji ?? '⚾'}</span>
              <div>
                <span className={`text-sm font-bold ${info?.color ?? 'text-white'}`}>
                  {info?.shortName ?? data.team.abbreviation}
                </span>
                <span className="text-xs text-gray-500 ml-2">{data.leagueRecord.wins}-{data.leagueRecord.losses}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.probablePitcher && (
                <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[100px]">
                  {data.probablePitcher.fullName.split(' ').pop()}
                </span>
              )}
              {(isLive || isFinal) && (
                <span className={`text-xl font-bold ${data.isWinner ? 'text-emerald-400' : 'text-white'}`}>
                  {data.score ?? 0}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lanceurs probables */}
      {isPre && (away.probablePitcher || home.probablePitcher) && (
        <div className="border-t border-gray-800 pt-2 mt-2">
          <p className="text-xs text-gray-600 mb-1">Lanceurs probables</p>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">{away.probablePitcher?.fullName ?? 'TBD'}</span>
            <span className="text-gray-600">vs</span>
            <span className="text-gray-400 text-right">{home.probablePitcher?.fullName ?? 'TBD'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
