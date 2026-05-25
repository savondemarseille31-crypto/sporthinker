import Link from 'next/link'
import Header from '@/components/Header'
import { getFixtureById, getPlayerStats, getH2H } from '@/lib/tennis-api'
import { generateTennisSignals, type TennisSignalInput } from '@/lib/tennis-signals'
import type { Signal, SignalForce } from '@/lib/signals'
import { notFound } from 'next/navigation'

export const revalidate = 120 // 2 min — stats h2h + signaux match

// ── Helpers visuels ────────────────────────────────────────────────────────────

function forceConfig(force: SignalForce) {
  switch (force) {
    case 'fort':         return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré':       return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30',  label: '🔶 Modéré' }
    case 'à surveiller': return { dot: 'bg-gray-400',    badge: 'bg-gray-700       text-gray-400    border border-gray-600',       label: '👁 À surveiller' }
  }
}

function surfaceColor(surface: string) {
  switch (surface) {
    case 'Clay':        return 'text-orange-400'
    case 'Grass':       return 'text-green-400'
    case 'Hard':
    case 'Indoor Hard': return 'text-blue-400'
    default:            return 'text-gray-400'
  }
}

function surfaceBadge(surface: string) {
  switch (surface) {
    case 'Clay':        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'Grass':       return 'bg-green-500/20  text-green-400  border-green-500/30'
    case 'Hard':
    case 'Indoor Hard': return 'bg-blue-500/20   text-blue-400   border-blue-500/30'
    default:            return 'bg-gray-700 text-gray-400 border-gray-600'
  }
}

function typeColor(type: string) {
  if (type.includes('Under'))   return 'text-blue-400'
  if (type.includes('Over'))    return 'text-orange-400'
  if (type.includes('Vainqueur')) return 'text-emerald-400'
  if (type.includes('Handicap')) return 'text-purple-400'
  if (type.includes('Value'))    return 'text-yellow-400'
  return 'text-white'
}

function StatBox({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800'}`}>
      <p className={`text-lg font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </div>
  )
}

function SignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
          {cfg.label}
        </span>
        <span className={`text-xs font-semibold ${typeColor(signal.typePari)}`}>{signal.typePari}</span>
      </div>

      <div className="bg-gray-800 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-500 mb-0.5">Pari recommandé</p>
        <p className={`text-base font-bold ${typeColor(signal.typePari)}`}>{signal.pari}</p>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">{signal.raisonnement}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {signal.stats.map((s, i) => (
          <div key={i} className={`text-center rounded-lg p-2 ${s.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.val}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/paris/calculateur"
        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
      >
        💰 Calculer la value →
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TennisMatchupPage({ params }: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await params
  const id = parseInt(fixtureId)
  if (isNaN(id)) notFound()

  const fixture = await getFixtureById(id)
  if (!fixture) notFound()

  const homeId = fixture.players.home.id
  const awayId = fixture.players.away.id

  const tour = fixture.tour
  const [homeStats, awayStats, h2h] = await Promise.all([
    getPlayerStats(homeId, tour).catch(() => null),
    getPlayerStats(awayId, tour).catch(() => null),
    getH2H(homeId, awayId, tour).catch(() => null),
  ])

  const input: TennisSignalInput = { fixture, homeStats, awayStats, h2h }
  const signals = generateTennisSignals(input)
  const forceOrder: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
  const sortedSignals = signals.sort((a, b) => forceOrder[a.force] - forceOrder[b.force])

  const { players, league, status, date, time } = fixture
  const home = players.home
  const away = players.away

  const isGrandSlam = league.type === 'Grand Slam'
  const bestOf: 3 | 5 = isGrandSlam ? 5 : 3

  const totalH2H = h2h ? h2h.player1Wins + h2h.player2Wins : 0
  const clayH2H  = h2h ? h2h.clayP1Wins + h2h.clayP2Wins  : 0

  const statusLabel = status.short === 'NS'   ? { text: 'À venir',  cls: 'text-gray-400' }
                    : status.short === 'LIVE' ? { text: '● LIVE',   cls: 'text-emerald-400 animate-pulse' }
                    : status.short === 'FT'   ? { text: 'Terminé',  cls: 'text-gray-500' }
                    : { text: status.long, cls: 'text-gray-500' }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/tennis" className="hover:text-emerald-400 transition-colors">🎾 Tennis</Link>
          <span>/</span>
          <span className="text-gray-300">{home.name} vs {away.name}</span>
        </div>

        {/* Header match */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${surfaceBadge(league.surface)}`}>
                {league.surface}
              </span>
              <span className="text-xs text-gray-500">{league.name}</span>
              <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">Best-of-{bestOf}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${statusLabel.cls}`}>{statusLabel.text}</span>
              <span className="text-sm text-gray-500">{date} · {time}</span>
            </div>
          </div>

          {/* Joueurs */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Joueur Home */}
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-1">{home.name}</p>
              <p className="text-lg text-emerald-400 font-semibold">#{home.ranking}</p>
              {home.nationality && <p className="text-xs text-gray-500 mt-1">{home.nationality}</p>}
              {home.hand && <p className="text-xs text-gray-600">{home.hand === 'Right' ? 'Droitier' : 'Gaucher'}</p>}
              {status.short === 'FT' && (
                <p className="text-3xl font-bold text-white mt-3">{fixture.scores.home.sets}</p>
              )}
            </div>

            {/* VS */}
            <div className="text-center">
              <p className={`text-lg font-bold ${surfaceColor(league.surface)}`}>VS</p>
              <p className="text-xs text-gray-600 mt-1">{league.surface}</p>
            </div>

            {/* Joueur Away */}
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-1">{away.name}</p>
              <p className="text-lg text-orange-400 font-semibold">#{away.ranking}</p>
              {away.nationality && <p className="text-xs text-gray-500 mt-1">{away.nationality}</p>}
              {away.hand && <p className="text-xs text-gray-600">{away.hand === 'Right' ? 'Droitier' : 'Gaucher'}</p>}
              {status.short === 'FT' && (
                <p className="text-3xl font-bold text-white mt-3">{fixture.scores.away.sets}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Signaux ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-emerald-300">⚡ Signaux</h2>
              {sortedSignals.length > 0
                ? <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{sortedSignals.length}</span>
                : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun</span>
              }
            </div>

            {sortedSignals.length > 0 ? (
              <div className="space-y-4">
                {sortedSignals.map(s => <SignalCard key={s.id} signal={s} />)}
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-gray-500 text-sm">Aucun signal détecté pour ce match.</p>
                <p className="text-gray-600 text-xs mt-1">L&apos;écart de ranking n&apos;est pas suffisant ou le match est terminé.</p>
              </div>
            )}

            {/* H2H */}
            {h2h && totalH2H > 0 && (
              <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-300 mb-4">📊 Historique H2H</h3>

                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{h2h.player1Wins}</p>
                    <p className="text-xs text-gray-500">{home.name.split(' ').pop()}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-500">{totalH2H}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-400">{h2h.player2Wins}</p>
                    <p className="text-xs text-gray-500">{away.name.split(' ').pop()}</p>
                  </div>
                </div>

                {clayH2H >= 2 && league.surface === 'Clay' && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-3 text-center">
                    <p className="text-xs text-orange-400 font-semibold mb-1">Sur terre battue</p>
                    <p className="text-sm text-white">
                      {home.name.split(' ').pop()} <span className="font-bold text-emerald-400">{h2h.clayP1Wins}</span>
                      {' – '}
                      <span className="font-bold text-orange-400">{h2h.clayP2Wins}</span> {away.name.split(' ').pop()}
                    </p>
                  </div>
                )}

                {h2h.lastMatches.length > 0 && (
                  <div className="space-y-2">
                    {h2h.lastMatches.slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${m.winner === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {m.winner === 1 ? home.name[0] : away.name[0]}
                          </span>
                          <span className="text-gray-400">{m.surface}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">{m.score}</span>
                          <span className="text-gray-600">{m.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Stats joueurs ── */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-200">📈 Stats joueurs</h2>

            {/* Stats Home */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-emerald-300">{home.name}</h3>
                <span className="text-xs text-gray-500">#{home.ranking} ATP/WTA</span>
              </div>

              {homeStats ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <StatBox label="1ère balle in"   value={`${homeStats.firstServeIn.toFixed(0)}%`} highlight={homeStats.firstServeIn >= 65} />
                    <StatBox label="Pts gagnés 1ère"  value={`${homeStats.ptsWonOn1stServe.toFixed(0)}%`} highlight={homeStats.ptsWonOn1stServe >= 72} />
                    <StatBox label="Pts gagnés 2ème"  value={`${homeStats.ptsWonOn2ndServe.toFixed(0)}%`} />
                    <StatBox label="Pts retour"        value={`${homeStats.returnPtsWon.toFixed(0)}%`} highlight={homeStats.returnPtsWon >= 40} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <StatBox label="% break convertis" value={`${homeStats.breakPtsConverted.toFixed(0)}%`} highlight={homeStats.breakPtsConverted >= 45} />
                    <StatBox label="% break sauvés"    value={`${homeStats.breakPtsSaved.toFixed(0)}%`}    highlight={homeStats.breakPtsSaved >= 65} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {homeStats.clayMatches >= 5 && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-orange-400">{(homeStats.clayWinRate * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Clay</p>
                        <p className="text-xs text-gray-600">{homeStats.clayMatches} matchs</p>
                      </div>
                    )}
                    {homeStats.hardMatches >= 5 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-blue-400">{(homeStats.hardWinRate * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Hard</p>
                        <p className="text-xs text-gray-600">{homeStats.hardMatches} matchs</p>
                      </div>
                    )}
                    {homeStats.grassMatches >= 5 && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-green-400">{(homeStats.grassWinRate * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Grass</p>
                        <p className="text-xs text-gray-600">{homeStats.grassMatches} matchs</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-right">
                    Bilan : {homeStats.matchesWon}V / {homeStats.matchesPlayed - homeStats.matchesWon}D ({homeStats.matchesPlayed} matchs)
                  </p>
                </>
              ) : (
                <p className="text-gray-600 text-sm text-center py-3">Stats non disponibles</p>
              )}
            </div>

            {/* Stats Away */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-orange-300">{away.name}</h3>
                <span className="text-xs text-gray-500">#{away.ranking} ATP/WTA</span>
              </div>

              {awayStats ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <StatBox label="1ère balle in"   value={`${awayStats.firstServeIn.toFixed(0)}%`} highlight={awayStats.firstServeIn >= 65} />
                    <StatBox label="Pts gagnés 1ère"  value={`${awayStats.ptsWonOn1stServe.toFixed(0)}%`} highlight={awayStats.ptsWonOn1stServe >= 72} />
                    <StatBox label="Pts gagnés 2ème"  value={`${awayStats.ptsWonOn2ndServe.toFixed(0)}%`} />
                    <StatBox label="Pts retour"        value={`${awayStats.returnPtsWon.toFixed(0)}%`} highlight={awayStats.returnPtsWon >= 40} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <StatBox label="% break convertis" value={`${awayStats.breakPtsConverted.toFixed(0)}%`} highlight={awayStats.breakPtsConverted >= 45} />
                    <StatBox label="% break sauvés"    value={`${awayStats.breakPtsSaved.toFixed(0)}%`}    highlight={awayStats.breakPtsSaved >= 65} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {awayStats.clayMatches >= 5 && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-orange-400">{(awayStats.clayWinRate * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Clay</p>
                        <p className="text-xs text-gray-600">{awayStats.clayMatches} matchs</p>
                      </div>
                    )}
                    {awayStats.hardMatches >= 5 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-blue-400">{(awayStats.hardWinRate * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Hard</p>
                        <p className="text-xs text-gray-600">{awayStats.hardMatches} matchs</p>
                      </div>
                    )}
                    {awayStats.grassMatches >= 5 && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-green-400">{(awayStats.grassWinRate * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Grass</p>
                        <p className="text-xs text-gray-600">{awayStats.grassMatches} matchs</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-right">
                    Bilan : {awayStats.matchesWon}V / {awayStats.matchesPlayed - awayStats.matchesWon}D ({awayStats.matchesPlayed} matchs)
                  </p>
                </>
              ) : (
                <p className="text-gray-600 text-sm text-center py-3">Stats non disponibles</p>
              )}
            </div>

            {/* Méthodologie */}
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300">
              <p className="font-semibold mb-1">ℹ️ Méthodologie</p>
              <p className="text-blue-400/80 text-xs leading-relaxed">
                Probabilités : 60% Elo (classement ATP/WTA) + 40% win rate surface (si ≥ 8 matchs disponibles).
                Ajustement H2H : ±3% max (min 3 confrontations). Total jeux : service dominance sur {league.surface}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
