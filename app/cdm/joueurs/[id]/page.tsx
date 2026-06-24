import Link from 'next/link'
import Header from '@/components/Header'
import { getPlayerById, ALL_CDM_PLAYERS } from '@/lib/cdm-players'
import { getBlendedStats } from '@/lib/cdm-blend-fetch'
import { generateSignalsFromBlended } from '@/lib/cdm-player-signals'
import { notFound } from 'next/navigation'

export const revalidate = 3600 // 1h — stats blend sélection + WC

export async function generateStaticParams() {
  return ALL_CDM_PLAYERS.map(p => ({ id: String(p.id) }))
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = getPlayerById(Number(id))
  if (!player) notFound()

  // Blend stats : club (statique) + sélection (API) + WC (API, live dès le 11 juin)
  const { blended, selStats, wcStats } = await getBlendedStats(player)

  const getFormeColor = (f: string) => {
    if (f === 'V') return 'bg-emerald-500'
    if (f === 'N') return 'bg-gray-500'
    return 'bg-red-500'
  }

  const xGDiff = (player.buts - player.xG).toFixed(1)
  const xGDiffNum = parseFloat(xGDiff)
  const surperformance = xGDiffNum > 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <Link href="/cdm/joueurs" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour joueurs</Link>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">{player.flag}</span>
                <div>
                  <h1 className="text-3xl font-bold">{player.nom}</h1>
                  <p className="text-gray-400">{player.poste} · {player.club} · {player.age} ans</p>
                </div>
              </div>
              <p className="text-gray-300 mt-4 max-w-xl">{player.description}</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-emerald-400">{player.note}</p>
              <p className="text-sm text-gray-500">Note saison</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '⚽ Buts', val: player.buts, sub: `xG: ${player.xG}` },
            { label: '🎯 Passes déc.', val: player.passes, sub: `xA: ${player.xA}` },
            { label: '🎯 Tirs', val: player.tirs, sub: `${(player.buts / player.tirs * 100).toFixed(0)}% conversion` },
            { label: '⏱️ Minutes', val: player.minutesJouees, sub: `${player.matchsJoues} matchs` },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-3xl font-bold text-white mb-1">{s.val}</p>
              <p className="text-xs text-gray-500">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-emerald-400">📊 Analyse xG — Efficacité devant le but</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Buts réels</p>
              <p className="text-3xl font-bold">{player.buts}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">xG attendus</p>
              <p className="text-3xl font-bold text-gray-400">{player.xG}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Différence</p>
              <p className={`text-3xl font-bold ${surperformance ? 'text-emerald-400' : 'text-red-400'}`}>
                {surperformance ? '+' : ''}{xGDiff}
              </p>
            </div>
          </div>
          <div className={`rounded-xl p-4 ${surperformance ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <p className={`text-sm font-medium ${surperformance ? 'text-emerald-400' : 'text-red-400'}`}>
              {surperformance
                ? `✅ ${player.nom} surperforme son xG de +${xGDiff} buts — finisseur exceptionnel, fiable pour les paris buteur.`
                : `⚠️ ${player.nom} sous-performe son xG de ${xGDiff} buts — peut être "dû" pour scorer, opportunité de pari.`
              }
            </p>
          </div>
        </div>

        {(() => {
          const wins = player.forme.filter(f => f === 'V').length
          const draws = player.forme.filter(f => f === 'N').length
          const losses = player.forme.filter(f => f === 'P').length
          const total = player.forme.length
          const winRate = Math.round((wins / total) * 100)
          const points = wins * 3 + draws
          const maxPoints = total * 3
          // Tendance : compare derniers 2 matchs vs premiers 3
          const recent = player.forme.slice(-2)
          const older = player.forme.slice(0, 3)
          const recentPts = recent.filter(f => f === 'V').length * 3 + recent.filter(f => f === 'N').length
          const olderPts = older.filter(f => f === 'V').length * 3 + older.filter(f => f === 'N').length
          const avgRecent = recentPts / recent.length
          const avgOlder = olderPts / older.length
          const tendance = avgRecent > avgOlder ? 'hausse' : avgRecent < avgOlder ? 'baisse' : 'stable'

          return (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-emerald-400">🔥 Forme récente en club</h2>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  tendance === 'hausse' ? 'bg-emerald-500/20 text-emerald-400' :
                  tendance === 'baisse' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {tendance === 'hausse' ? '↑ En hausse' : tendance === 'baisse' ? '↓ En baisse' : '→ Stable'}
                </span>
              </div>

              {/* Dots de forme */}
              <div className="flex items-center gap-3 mb-5">
                {player.forme.map((f, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-12 h-12 rounded-full ${getFormeColor(f)} flex items-center justify-center text-lg font-bold text-white mb-1 shadow-lg`}>
                      {f}
                    </div>
                    <p className="text-xs text-gray-500">J-{player.forme.length - i}</p>
                  </div>
                ))}
              </div>

              {/* Stats de forme */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{wins}</p>
                  <p className="text-xs text-gray-500">Victoires</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-400">{draws}</p>
                  <p className="text-xs text-gray-500">Nuls</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{losses}</p>
                  <p className="text-xs text-gray-500">Défaites</p>
                </div>
              </div>

              {/* Barre % victoires */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Taux de victoire</span>
                  <span className="font-semibold text-white">{winRate}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${winRate}%` }} />
                </div>
              </div>

              {/* Points de forme */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Points de forme</span>
                <span className="font-bold text-white">{points} / {maxPoints} pts</span>
              </div>
            </div>
          )
        })()}

        {/* ── STATS PARIS (blendées) ── */}
        {(() => {
          const signals = generateSignalsFromBlended(player, blended)
          const hasData = player.poste !== 'Gardien'

          const chipColor = (force: string) =>
            force === 'fort'   ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : force === 'modéré' ? 'bg-yellow-500/20  text-yellow-400  border-yellow-500/30'
            : 'bg-gray-700/50 text-gray-400 border-gray-600'

          const buteurSig  = signals.find(s => s.marché === 'buteur')
          const cadreSig   = signals.find(s => s.marché === 'tirs-cadrés')
          const cartonSig  = signals.find(s => s.marché === 'carton-jaune')
          const passeurSig = signals.find(s => s.marché === 'passeur')

          const sourceColor = (c: typeof blended.confiance) =>
            c === 'haute' ? 'text-emerald-400' : c === 'moyenne' ? 'text-yellow-400' : 'text-gray-500'

          return (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-emerald-400">🎰 Stats par match — Marchés disponibles</h2>
              </div>

              {/* Source badge */}
              <div className="mb-4 flex items-center gap-2">
                <span className={`text-xs font-medium ${sourceColor(blended.confiance)}`}>
                  ● {blended.confiance === 'haute' ? 'Haute confiance' : blended.confiance === 'moyenne' ? 'Confiance moyenne' : 'Petit échantillon'}
                </span>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-gray-500">{blended.sourceLabel}</span>
                {selStats && (
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full ml-1">
                    + stats sélection
                  </span>
                )}
                {wcStats && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    + stats WC live
                  </span>
                )}
              </div>

              {!hasData ? (
                <p className="text-gray-500 text-sm">Stats marchés non applicables aux gardiens.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* BUTEUR */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">⚽ Buteur / xG</p>
                      {buteurSig && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${chipColor(buteurSig.force)}`}>
                          {buteurSig.force}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">xG/match</span>
                        <span className="font-bold text-emerald-400">{blended.xGParMatch.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tirs/match</span>
                        <span className="font-bold text-white">{blended.tirsParMatch.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cadrés/match</span>
                        <span className="font-bold text-white">{blended.tirsCadrésParMatch.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Buts club saison</span>
                        <span className="font-bold text-white">{player.buts}</span>
                      </div>
                    </div>
                  </div>

                  {/* CARTONS */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">🟨 Carton jaune</p>
                      {cartonSig && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${chipColor(cartonSig.force)}`}>
                          {cartonSig.force}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fréquence</span>
                        <span className="font-bold text-white">
                          {blended.cartonsJaunesParMatch > 0
                            ? `${(blended.cartonsJaunesParMatch * 100).toFixed(0)}% des matchs`
                            : '—'}
                        </span>
                      </div>
                      {blended.cartonsJaunesParMatch > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">1 tous les…</span>
                          <span className="font-bold text-yellow-400">
                            ~{Math.round(1 / blended.cartonsJaunesParMatch)} matchs
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Matchs analysés</span>
                        <span className="font-bold text-white">{blended.matchsJoues}</span>
                      </div>
                    </div>
                  </div>

                  {/* PASSEUR */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">🎯 Passeur décisif</p>
                      {passeurSig && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${chipColor(passeurSig.force)}`}>
                          {passeurSig.force}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">xA/match</span>
                        <span className="font-bold text-emerald-400">{blended.xAParMatch.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Passes clés/match</span>
                        <span className="font-bold text-white">{blended.passesClésParMatch.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Passes déc. club</span>
                        <span className="font-bold text-white">{player.passes}</span>
                      </div>
                    </div>
                  </div>

                  {/* TIRS CADRÉS */}
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">🎯 Tirs cadrés</p>
                      {cadreSig && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${chipColor(cadreSig.force)}`}>
                          {cadreSig.force}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cadrés/match</span>
                        <span className="font-bold text-emerald-400">{blended.tirsCadrésParMatch.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">% précision</span>
                        <span className={`font-bold ${
                          blended.tirsParMatch > 0 && (blended.tirsCadrésParMatch / blended.tirsParMatch) >= 0.40
                            ? 'text-emerald-400'
                            : (blended.tirsCadrésParMatch / blended.tirsParMatch) >= 0.30
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}>
                          {blended.tirsParMatch > 0
                            ? `${Math.round((blended.tirsCadrésParMatch / blended.tirsParMatch) * 100)}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tirs/match</span>
                        <span className="font-bold text-white">{blended.tirsParMatch.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })()}

        {/* ── CONSEIL PARIS ── */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3 text-emerald-400">💰 Conseil Paris Deltavyn</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• <strong>Buteur du match :</strong> {player.buts > player.xG ? 'Excellent finisseur, cote souvent sous-évaluée' : 'Peut être en manque de réalisme, surveiller les occasions créées'}</p>
            <p>• <strong>Tirs cadrés :</strong> {player.tirsCadres != null && player.matchsJoues > 0 ? `${(player.tirsCadres / player.matchsJoues).toFixed(1)} cadrés/match en moyenne — ${(player.tirsCadres / player.matchsJoues) >= 2 ? 'marché "tirs cadrés" intéressant' : 'volume insuffisant pour ce marché'}` : 'Données insuffisantes'}</p>
            <p>• <strong>Carton jaune :</strong> {player.cartonsJaunes != null ? (player.cartonsJaunes >= 6 ? `⚠️ ${player.cartonsJaunes} cartons cette saison — profil à risque, marché carton pertinent` : player.cartonsJaunes >= 3 ? `${player.cartonsJaunes} cartons — risque modéré` : 'Peu de cartons, marché carton déconseillé') : 'Données insuffisantes'}</p>
            <p>• <strong>Forme :</strong> {player.forme.filter(f => f === 'V').length >= 3 ? '🔥 En grande forme, profil de match à suivre' : '⚠️ Forme irrégulière, risque plus élevé'}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
