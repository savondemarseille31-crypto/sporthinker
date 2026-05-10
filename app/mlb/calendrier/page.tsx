'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { getSchedule, MLB_TEAMS, formatGameTime, type MLBGame } from '@/lib/mlb-api'

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function MLBCalendrierPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [games, setGames] = useState<MLBGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSchedule(date).then(g => { setGames(g); setLoading(false) })
  }, [date])

  const liveGames = games.filter(g => g.status.abstractGameState === 'Live')
  const upcomingGames = games.filter(g => g.status.abstractGameState === 'Preview')
  const finishedGames = games.filter(g => g.status.abstractGameState === 'Final')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        <Link href="/mlb" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour MLB</Link>
        <h1 className="text-3xl font-bold mt-2 mb-1">📅 Calendrier MLB</h1>
        <p className="text-gray-400 text-sm mb-6">Matchups du jour avec lanceurs probables — clé pour le value betting</p>

        {/* Navigation dates */}
        <div className="flex items-center gap-3 mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <button onClick={() => setDate(d => addDays(d, -1))}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors">
            ←
          </button>
          <div className="flex-1 text-center">
            <p className="font-semibold capitalize">{fmtDate(date)}</p>
            {date !== today && (
              <button onClick={() => setDate(today)} className="text-xs text-emerald-400 hover:underline mt-0.5">
                Revenir à aujourd'hui
              </button>
            )}
          </div>
          <button onClick={() => setDate(d => addDays(d, 1))}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors">
            →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-3xl mb-3 animate-spin">⚾</p>
            <p>Chargement des matchs...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-3xl mb-3">😴</p>
            <p>Aucun match programmé ce jour</p>
          </div>
        ) : (
          <div className="space-y-8">
            {liveGames.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  En direct ({liveGames.length} matchs)
                </h2>
                <div className="space-y-3">
                  {liveGames.map(g => <FullGameCard key={g.gamePk} game={g} />)}
                </div>
              </section>
            )}

            {upcomingGames.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-emerald-400 mb-3">
                  🎯 À venir — Matchups lanceurs ({upcomingGames.length} matchs)
                </h2>
                <div className="space-y-3">
                  {upcomingGames.map(g => <FullGameCard key={g.gamePk} game={g} />)}
                </div>
              </section>
            )}

            {finishedGames.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-500 mb-3">
                  ✅ Résultats ({finishedGames.length} matchs)
                </h2>
                <div className="space-y-3">
                  {finishedGames.map(g => <FullGameCard key={g.gamePk} game={g} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function FullGameCard({ game }: { game: MLBGame }) {
  const { home, away } = game.teams
  const homeInfo = MLB_TEAMS[home.team.id]
  const awayInfo = MLB_TEAMS[away.team.id]
  const isLive = game.status.abstractGameState === 'Live'
  const isFinal = game.status.abstractGameState === 'Final'
  const isPre = game.status.abstractGameState === 'Preview'

  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 ${isLive ? 'border-red-500/40' : 'border-gray-800'}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Teams + score */}
        <div className="flex-1 space-y-3">
          {[
            { data: away, info: awayInfo, side: 'Extérieur' },
            { data: home, info: homeInfo, side: 'Domicile' },
          ].map(({ data, info, side }) => (
            <div key={data.team.id} className="flex items-center gap-3">
              <span className="text-2xl">{info?.emoji ?? '⚾'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${info?.color ?? 'text-white'}`}>{data.team.name}</span>
                  <span className="text-xs text-gray-500">({data.leagueRecord.wins}-{data.leagueRecord.losses})</span>
                  <span className="text-xs text-gray-600">{side}</span>
                </div>
                {data.probablePitcher && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    🥎 {data.probablePitcher.fullName}
                  </p>
                )}
              </div>
              {(isLive || isFinal) && (
                <span className={`text-3xl font-bold ${data.isWinner ? 'text-emerald-400' : 'text-white'}`}>
                  {data.score ?? 0}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Infos droite */}
        <div className="text-right shrink-0">
          {isPre && (
            <p className="text-sm font-semibold text-white">
              {formatGameTime(game.gameDate, game.status.startTimeTBD)}
            </p>
          )}
          {isLive && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
              {game.linescore?.currentInningOrdinal} {game.linescore?.inningHalf}
            </span>
          )}
          {isFinal && (
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">Final</span>
          )}
          <p className="text-xs text-gray-600 mt-1">{game.venue.name}</p>
        </div>
      </div>

      {/* Bouton analyse paris */}
      {isPre && (
        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            {away.probablePitcher && home.probablePitcher
              ? `${away.probablePitcher.fullName.split(' ').pop()} vs ${home.probablePitcher.fullName.split(' ').pop()}`
              : 'Lanceurs TBD'}
          </p>
          <Link href="/paris/calculateur"
            className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg hover:bg-emerald-500/30 transition-colors">
            Analyser ce match →
          </Link>
        </div>
      )}
    </div>
  )
}
