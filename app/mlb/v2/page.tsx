import Link from 'next/link'
import Header from '@/components/Header'
import { getSchedule, getStandings, getPitcherSeasonStats } from '@/lib/mlb-api'
import { generateMLBSignal, type Signal, type SignalForce } from '@/lib/signals'
import { analyzeGameV2 } from '@/lib/mlb-v2-signals'

export const revalidate = 300

// ── SignalCard — même modèle que /signaux ─────────────────────────────────────
function forceConfig(force: SignalForce) {
  switch (force) {
    case 'fort':          return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré':        return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30',  label: '🔶 Modéré' }
    case 'à surveiller':  return { dot: 'bg-gray-400',    badge: 'bg-gray-700       text-gray-400    border border-gray-600',        label: '👁 À surveiller' }
  }
}

function typeColor(type: string) {
  if (type.includes('Under'))   return 'text-blue-400'
  if (type.includes('Over'))    return 'text-orange-400'
  if (type.includes('Money'))   return 'text-emerald-400'
  if (type.includes('First 5')) return 'text-purple-400'
  return 'text-white'
}

function SignalCard({ signal, accent }: { signal: Signal; accent?: string }) {
  const cfg = forceConfig(signal.force)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
            {cfg.label}
          </span>
          {accent && (
            <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 font-semibold ${accent}`}>
              ⚾ MLB
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">{signal.date}</p>
          <p className="text-xs text-gray-600">{signal.heure}</p>
        </div>
      </div>

      {/* Match + pari */}
      <div>
        <p className="text-sm text-gray-400 mb-1">
          {signal.flagDom} {signal.flagExt}{' '}
          <span className="font-semibold text-white ml-1">{signal.match}</span>
        </p>
        <div className="mt-2 bg-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Pari recommandé</p>
          <p className={`text-base font-bold ${typeColor(signal.typePari)}`}>{signal.pari}</p>
          <p className="text-xs text-gray-500 mt-0.5">{signal.typePari}</p>
        </div>
      </div>

      {/* Raisonnement */}
      <p className="text-sm text-gray-400 leading-relaxed">{signal.raisonnement}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {signal.stats.map((s, i) => (
          <div key={i} className={`text-center rounded-lg p-2 ${s.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.val}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kelly chips — uniquement sur les Moneylines avec pImpl */}
      {signal.pImpl && signal.coteMin && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-semibold">
            P(win) {Math.round(signal.pImpl * 100)}%
          </span>
          <span className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded-full">
            Cote min. {signal.coteMin}
          </span>
        </div>
      )}

      {/* CTA */}
      <Link
        href={signal.pImpl
          ? `/paris/calculateur?p=${Math.round(signal.pImpl * 100)}`
          : '/paris/calculateur'
        }
        className="mt-auto flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
      >
        💰 Calculer la value →
      </Link>
    </div>
  )
}

function EmptyState({ label, href, linkLabel }: { label: string; href: string; linkLabel: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <Link href={href} className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
        {linkLabel}
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function MLBv2Page() {
  const [games, standings] = await Promise.all([getSchedule(), getStandings()])
  const previewGames = games.filter(g => g.status.abstractGameState === 'Preview')

  // RPG pour V1
  const teamRPG: Record<number, number> = {}
  for (const div of standings) {
    for (const rec of div.teamRecords) {
      const gp = rec.wins + rec.losses
      if (gp > 0 && rec.runsScored) teamRPG[rec.team.id] = rec.runsScored / gp
    }
  }

  // V2 + V1 en parallèle
  const [v2Analyses, v1Signals] = await Promise.all([
    Promise.all(previewGames.map(analyzeGameV2)),
    Promise.all(
      previewGames.map(async (game) => {
        const [homeStats, awayStats] = await Promise.all([
          game.teams.home.probablePitcher?.id
            ? getPitcherSeasonStats(game.teams.home.probablePitcher.id)
            : Promise.resolve(null),
          game.teams.away.probablePitcher?.id
            ? getPitcherSeasonStats(game.teams.away.probablePitcher.id)
            : Promise.resolve(null),
        ])
        return generateMLBSignal(game, homeStats, awayStats, teamRPG)
      })
    ),
  ])

  const v2Signals = v2Analyses.map(a => a.signal).filter(Boolean) as Signal[]
  const v1Only    = v1Signals.filter(Boolean) as Signal[]

  const forceOrder: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
  const sorted = (arr: Signal[]) => [...arr].sort((a, b) => forceOrder[a.force] - forceOrder[b.force])

  const agreements = v2Analyses.filter((a, i) => {
    const v1 = v1Signals[i]
    if (!a.signal || !v1) return false
    const t2 = a.signal.typePari.toLowerCase()
    const t1 = v1.typePari.toLowerCase()
    return (t2.includes('under') && t1.includes('under'))
        || (t2.includes('over')  && t1.includes('over'))
        || (t2.includes('money') && t1.includes('money'))
  }).length

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">🧪 MLB v2 TEST</h1>
            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs px-2 py-1 rounded-full font-semibold">
              Expérimental
            </span>
          </div>
          <p className="text-gray-400">
            Comparaison v1 (ERA + WHIP) vs v2 (FIP + wOBA + Park Factor) — évaluation sur 1-2 semaines
          </p>
        </div>

        {/* Bannière algo — compacte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">📊</span>
            <div>
              <p className="text-xs font-bold text-blue-400 mb-1">V1 — ERA + WHIP (actuel)</p>
              <p className="text-xs text-gray-400">ERA lanceur partant · WHIP · RPG équipe</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-emerald-400 mt-0.5">🧪</span>
            <div>
              <p className="text-xs font-bold text-emerald-400 mb-1">V2 — FIP + wOBA + Park Factor</p>
              <p className="text-xs text-gray-400">FIP (défense-indépendant) · wOBA offense · Park factor stade</p>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{previewGames.length}</p>
            <p className="text-xs text-gray-500 mt-1">Matchs analysés</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{v2Signals.length}</p>
            <p className="text-xs text-gray-500 mt-1">🧪 Signaux V2</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{v1Only.length}</p>
            <p className="text-xs text-gray-500 mt-1">📊 Signaux V1</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{agreements}</p>
            <p className="text-xs text-gray-500 mt-1">Accords V1 ∩ V2</p>
          </div>
        </div>

        {previewGames.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-5xl mb-4">⚾</p>
            <p className="text-xl font-semibold mb-2">Aucun match MLB aujourd&apos;hui</p>
            <Link href="/mlb" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Voir le calendrier →
            </Link>
          </div>
        ) : (
          <>
            {/* V2 signals */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-emerald-300">🧪 Signaux V2 — FIP + wOBA + Park Factor</h2>
                {v2Signals.length > 0
                  ? <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{v2Signals.length} signal{v2Signals.length > 1 ? 's' : ''}</span>
                  : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun signal</span>
                }
              </div>
              {sorted(v2Signals).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sorted(v2Signals).map(s => (
                    <SignalCard key={s.id} signal={s} accent="text-emerald-300" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  label="Aucun écart statistique significatif détecté par V2 aujourd'hui"
                  href="/mlb"
                  linkLabel="Voir les matchs du jour →"
                />
              )}
            </section>

            {/* V1 signals */}
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-blue-300">📊 Signaux V1 — ERA + WHIP (référence)</h2>
                {v1Only.length > 0
                  ? <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{v1Only.length} signal{v1Only.length > 1 ? 's' : ''}</span>
                  : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Aucun signal</span>
                }
              </div>
              {sorted(v1Only).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sorted(v1Only).map(s => (
                    <SignalCard key={s.id} signal={s} accent="text-blue-300" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  label="Aucun écart ERA significatif détecté par V1 aujourd'hui"
                  href="/mlb"
                  linkLabel="Voir les matchs du jour →"
                />
              )}
            </section>
          </>
        )}

        {/* Nav */}
        <div className="flex gap-3">
          <Link href="/mlb"
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-sm text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors">
            ← MLB v1
          </Link>
          <Link href="/signaux"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
            Tous les signaux →
          </Link>
        </div>
      </div>
    </main>
  )
}
