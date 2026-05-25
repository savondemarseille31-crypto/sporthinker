import Header from '@/components/Header'
import Link from 'next/link'
import {
  generateMLSSignalsForToday,
  getMLSFixturesByDate,
  getMLSStandings,
  teamEmoji,
  type MLSFixture,
} from '@/lib/mls-signals'
import type { Signal, SignalForce } from '@/lib/signals'

export const revalidate = 600  // 10 min — programme MLS + signaux

// ── Helpers visuels ────────────────────────────────────────────────────────────

function forceConfig(force: SignalForce) {
  switch (force) {
    case 'fort':          return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré':        return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30',  label: '🔶 Modéré' }
    case 'à surveiller':  return { dot: 'bg-gray-400',    badge: 'bg-gray-700       text-gray-400    border border-gray-600',       label: '👁 À surveiller' }
  }
}

function typeColor(type: string) {
  if (type.includes('Under'))   return 'text-blue-400'
  if (type.includes('Over'))    return 'text-orange-400'
  if (type.includes('Money'))   return 'text-emerald-400'
  return 'text-white'
}

function statusLabel(short: string) {
  if (short === 'NS' || short === 'TBD') return { cls: 'text-gray-400',                  label: 'À venir'  }
  if (['1H','HT','2H','ET','P'].includes(short))  return { cls: 'text-emerald-400 animate-pulse', label: '● LIVE'   }
  return                                            { cls: 'text-gray-500',                  label: 'Terminé'  }
}

// ── Carte signal ───────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
          {cfg.label}
        </span>
        <div className="text-right">
          <p className="text-xs text-gray-500">{signal.date}</p>
          <p className="text-xs text-gray-600">{signal.heure}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-2">
          {signal.flagDom} {signal.flagExt} <span className="font-semibold text-white ml-1">{signal.match}</span>
        </p>
        <div className="bg-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Pari recommandé</p>
          <p className={`text-base font-bold ${typeColor(signal.typePari)}`}>{signal.pari}</p>
          <p className="text-xs text-gray-500 mt-0.5">{signal.typePari}</p>
        </div>
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

// ── Carte match ────────────────────────────────────────────────────────────────

function MatchCard({ fixture, signals }: { fixture: MLSFixture; signals: Signal[] }) {
  const st = statusLabel(fixture.fixture.status.short)
  const heure = new Date(fixture.fixture.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
  })
  const matchSignals = signals.filter(s =>
    s.match === `${fixture.teams.home.name} vs ${fixture.teams.away.name}`
  )
  const isLive = ['1H','HT','2H','ET','P'].includes(fixture.fixture.status.short)
  const isFinal = fixture.fixture.status.short === 'FT'

  return (
    <div className={`bg-gray-900 border rounded-2xl p-4 flex flex-col gap-3 transition-colors hover:border-gray-700 ${isLive ? 'border-emerald-500/40' : 'border-gray-800'}`}>
      {/* Status + heure */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${st.cls}`}>{st.label}</span>
        <div className="text-right">
          <p className="text-xs text-gray-500">{heure}</p>
          {fixture.fixture.venue.city && (
            <p className="text-xs text-gray-600">{fixture.fixture.venue.city}</p>
          )}
        </div>
      </div>

      {/* Équipes + score */}
      <div className="space-y-1.5">
        {[
          { team: fixture.teams.home, goals: fixture.goals.home },
          { team: fixture.teams.away, goals: fixture.goals.away },
        ].map(({ team, goals }) => (
          <div key={team.id} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-sm text-white">
              <span>{teamEmoji(team.name)}</span>
              <span>{team.name}</span>
            </span>
            {(isLive || isFinal) && goals != null && (
              <span className={`text-sm font-bold ${team.winner ? 'text-emerald-400' : 'text-gray-400'}`}>
                {goals}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Signal badge si présent */}
      {matchSignals.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {matchSignals.map(s => {
            const cfg = forceConfig(s.force)
            return (
              <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                {s.pari}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MLSPage() {
  const today = new Date().toISOString().split('T')[0]

  const [signals, fixtures, standings] = await Promise.all([
    generateMLSSignalsForToday().catch(() => [] as Signal[]),
    getMLSFixturesByDate(today).catch(() => [] as MLSFixture[]),
    getMLSStandings().catch(() => []),
  ])

  const upcoming  = fixtures.filter(f => f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD')
  const live      = fixtures.filter(f => ['1H','HT','2H','ET','P'].includes(f.fixture.status.short))
  const finished  = fixtures.filter(f => f.fixture.status.short === 'FT')

  // Top 3 classement par conférence (points)
  const eastern = standings.filter(s => s.conference === 'Eastern').slice(0, 3)
  const western = standings.filter(s => s.conference === 'Western').slice(0, 3)

  const fortsCount = signals.filter(s => s.force === 'fort').length
  const noGames    = fixtures.length === 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">⚽ MLS</h1>
          <p className="text-gray-400">Major League Soccer 2026 · Signaux probabilistes · Analyse par win rate contextuel</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{fixtures.length || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Matchs aujourd'hui</p>
          </div>
          <div className={`border rounded-2xl p-4 text-center ${live.length > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-900 border-gray-800'}`}>
            <p className={`text-2xl font-bold ${live.length > 0 ? 'text-emerald-400' : 'text-white'}`}>{live.length || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">{live.length > 0 ? '● En cours' : 'En cours'}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{fortsCount || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Signaux forts</p>
          </div>
          <Link href="/paris/calculateur" className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center hover:border-orange-400/60 transition-colors block">
            <p className="text-2xl font-bold text-orange-400">💰</p>
            <p className="text-xs text-gray-500 mt-1">Calculateur value</p>
          </Link>
        </div>

        {/* Banner algo */}
        <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300 flex gap-3 items-start">
          <span className="text-xl shrink-0">📊</span>
          <div>
            <p className="font-semibold mb-1">Algo probabiliste MLS v1</p>
            <p className="text-blue-400/80">
              P(victoire) = 65% win rate contextuel (domicile/extérieur) + 35% win rate global · Boost avantage terrain MLS (+6%) · Signaux si P ≥ 63% ou total buts hors norme.
            </p>
          </div>
        </div>

        {noGames && (
          <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-semibold text-white mb-1">Pas de match MLS aujourd'hui</p>
            <p className="text-sm text-gray-500">La MLS joue principalement les mercredis et week-ends. Consulte le programme de la semaine ci-dessous.</p>
          </div>
        )}

        {/* ── Signaux du jour ──────────────────────────────────────────────── */}
        {signals.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-emerald-300">⚡ Signaux du jour</h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                {signals.length} signal{signals.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {signals.map(s => <SignalCard key={s.id} signal={s} />)}
            </div>
          </section>
        )}

        {/* ── Programme du jour ─────────────────────────────────────────────── */}
        {fixtures.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-6 text-gray-200">⚽ Programme du jour</h2>

            {live.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-emerald-400 mb-3">● En direct</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {live.map(f => <MatchCard key={f.fixture.id} fixture={f} signals={signals} />)}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">À venir</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {upcoming.map(f => <MatchCard key={f.fixture.id} fixture={f} signals={signals} />)}
                </div>
              </div>
            )}

            {finished.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Terminés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {finished.map(f => <MatchCard key={f.fixture.id} fixture={f} signals={signals} />)}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Classements ───────────────────────────────────────────────────── */}
        {standings.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-6 text-gray-200">🏆 Classements MLS 2026</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Conférence Est */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-blue-400 mb-4">Est — Top 3</h3>
                <div className="space-y-3">
                  {eastern.map((s, i) => (
                    <div key={s.team.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                        <span className="text-sm font-medium text-white">{teamEmoji(s.team.name)} {s.team.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{s.all.win}V-{s.all.draw}N-{s.all.lose}D</span>
                        <span className="font-bold text-white">{s.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="#" className="block text-xs text-gray-600 hover:text-gray-400 mt-4 text-center transition-colors">
                  Classement complet →
                </Link>
              </div>

              {/* Conférence Ouest */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-orange-400 mb-4">Ouest — Top 3</h3>
                <div className="space-y-3">
                  {western.map((s, i) => (
                    <div key={s.team.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                        <span className="text-sm font-medium text-white">{teamEmoji(s.team.name)} {s.team.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{s.all.win}V-{s.all.draw}N-{s.all.lose}D</span>
                        <span className="font-bold text-white">{s.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="#" className="block text-xs text-gray-600 hover:text-gray-400 mt-4 text-center transition-colors">
                  Classement complet →
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
