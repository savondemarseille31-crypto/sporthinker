import Header from '@/components/Header'
import Link from 'next/link'
import { getEntitlement } from '@/lib/entitlement'
import { LockedSignalCard, PaywallNotice } from '@/components/PremiumLock'
import { getESPNTennisSchedule, type ESPNMatch } from '@/lib/espn-tennis'
import { generateSignalFromESPNMatch } from '@/lib/tennis-signals'
import type { Signal, SignalForce } from '@/lib/signals'

export const revalidate = 1800  // 30 min — programme ESPN + signaux

// ── Helpers visuels ────────────────────────────────────────────────────────────

function forceConfig(force: SignalForce) {
  switch (force) {
    case 'fort':         return { dot: 'bg-violet-400', badge: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', label: '⚡ Fort' }
    case 'modéré':       return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30',  label: '🔶 Modéré' }
    case 'à surveiller': return { dot: 'bg-gray-400',    badge: 'bg-gray-700       text-gray-400    border border-gray-600',       label: '👁 À surveiller' }
  }
}

function levelBadge(level: string | undefined) {
  if (!level) return 'bg-gray-800 text-gray-500'
  if (level === 'Grand Slam')                                   return 'bg-yellow-500/20 text-yellow-400'
  if (level === 'Masters 1000' || level === 'WTA 1000')         return 'bg-purple-500/20 text-purple-400'
  if (level.includes('500'))                                    return 'bg-blue-500/20   text-blue-400'
  if (level.includes('250'))                                    return 'bg-gray-700       text-gray-300'
  return 'bg-gray-800 text-gray-500'
}

function typeColor(type: string) {
  if (type.includes('Vainqueur'))  return 'text-violet-400'
  if (type.includes('Handicap'))   return 'text-purple-400'
  if (type.includes('Under'))      return 'text-blue-400'
  if (type.includes('Over'))       return 'text-orange-400'
  return 'text-white'
}

function statusLabel(status: ESPNMatch['status']) {
  if (status === 'scheduled') return { cls: 'text-gray-400',                    label: 'À venir'  }
  if (status === 'live')      return { cls: 'text-violet-400 animate-pulse',   label: '● LIVE'   }
  return                             { cls: 'text-gray-500',                    label: 'Terminé'  }
}

// ── En-tête de tournoi ─────────────────────────────────────────────────────────

function TournamentHeader({
  name, level, count, unit,
}: { name: string; level?: string; count: number; unit: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <h3 className="text-lg font-bold text-white">{name}</h3>
      {level && (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${levelBadge(level)}`}>{level}</span>
      )}
      <span className="text-xs text-gray-500 ml-auto">{count} {unit}{count > 1 ? 's' : ''}</span>
    </div>
  )
}

// ── Carte signal ───────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force)
  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
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
          <div key={i} className={`text-center rounded-lg p-2 ${s.highlight ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-violet-400' : 'text-white'}`}>{s.val}</p>
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

// ── Carte match ESPN ───────────────────────────────────────────────────────────

function MatchCard({ match, signals, premium }: { match: ESPNMatch; signals: Signal[]; premium: boolean }) {
  const st = statusLabel(match.status)
  const matchSignals = signals.filter(s =>
    s.match === `${match.p1.name} vs ${match.p2.name}` ||
    s.match === `${match.p2.name} vs ${match.p1.name}`
  )

  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      {/* Status + heure + court */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${st.cls}`}>{st.label}</span>
        <div className="text-right">
          {match.time && <p className="text-xs text-gray-500">{match.time}</p>}
          {match.court && <p className="text-xs text-gray-600">{match.court}</p>}
        </div>
      </div>

      {/* Joueurs */}
      <div className="space-y-2">
        {[match.p1, match.p2].map(p => (
          <div key={p.id} className="flex items-center justify-between">
            <span className="font-semibold text-white text-sm">{p.name}</span>
            {p.rank && <span className="text-xs text-gray-500">#{p.rank}</span>}
          </div>
        ))}
      </div>

      {/* Résultat si terminé */}
      {match.status === 'final' && match.resultNote && (
        <p className="text-xs text-gray-500 italic">{match.resultNote}</p>
      )}

      {/* Signaux associés — masqués hors premium (le type de pari est du contenu payant) */}
      {premium && matchSignals.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {matchSignals.map(s => {
            const cfg = forceConfig(s.force)
            return (
              <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                {s.typePari}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TennisPage() {
  const today = new Date().toISOString().split('T')[0]
  const { premium } = await getEntitlement()

  const matches = await getESPNTennisSchedule(today).catch(() => [] as ESPNMatch[])

  // Signaux depuis ESPN + profils statiques
  const scheduled = matches.filter(m => m.status === 'scheduled')
  const rawSignals = scheduled.flatMap(m => generateSignalFromESPNMatch(m))
  const forceOrder: Record<SignalForce, number> = { fort: 0, modéré: 1, 'à surveiller': 2 }
  const signals = [...rawSignals].sort((a, b) => forceOrder[a.force] - forceOrder[b.force])

  // ── Groupements par tournoi ────────────────────────────────────────────────

  const signalsByTournament = new Map<string, { signals: Signal[]; level?: string }>()
  for (const s of signals) {
    const key = s.tournament ?? 'Autres'
    if (!signalsByTournament.has(key)) signalsByTournament.set(key, { signals: [], level: s.tournamentLevel })
    signalsByTournament.get(key)!.signals.push(s)
  }

  const matchesByTournament = new Map<string, { matches: ESPNMatch[]; isMajor: boolean }>()
  for (const m of matches) {
    const key = m.tournament
    if (!matchesByTournament.has(key)) matchesByTournament.set(key, { matches: [], isMajor: m.isMajor })
    matchesByTournament.get(key)!.matches.push(m)
  }

  // Trier : Grand Slam (major) en premier, puis alphabétique
  const sortedMatchTournaments = [...matchesByTournament.entries()].sort(([, a], [, b]) => {
    if (a.isMajor && !b.isMajor) return -1
    if (!a.isMajor && b.isMajor) return 1
    return 0
  })

  const noData = !matches.length

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">🎾 Tennis</h1>
          <p className="text-gray-400">Signaux ATP &amp; WTA · Via ESPN</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{matches.length || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Matchs aujourd&apos;hui</p>
          </div>
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{matchesByTournament.size || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Tournois actifs</p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{signals.filter(s => s.force === 'fort').length || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Signaux forts</p>
          </div>
          <Link href="/tennis/classements" className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center hover:border-orange-400/60 transition-colors block">
            <p className="text-2xl font-bold text-orange-400">🏆</p>
            <p className="text-xs text-gray-500 mt-1">Classements ATP/WTA</p>
          </Link>
        </div>

        {noData && (
          <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-sm text-blue-300 flex gap-3 items-start">
            <span className="text-xl shrink-0">📡</span>
            <div>
              <p className="font-semibold mb-1">Aucun match trouvé pour aujourd&apos;hui</p>
              <p className="text-blue-400/80">L&apos;API ESPN sera mise à jour automatiquement quand le programme sera disponible.</p>
            </div>
          </div>
        )}

        {!premium && signals.length > 0 && <PaywallNotice count={signals.length} />}

        {/* ── Signaux groupés par tournoi ────────────────────────────────── */}
        {signals.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-violet-300">⚡ Signaux du jour</h2>
              <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                {signals.length} signal{signals.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-8">
              {Array.from(signalsByTournament.entries()).map(([name, { signals: sigs, level }]) => (
                <div key={name}>
                  <TournamentHeader name={name} level={level} count={sigs.length} unit="signal" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sigs.map(s => premium
                      ? <SignalCard key={s.id} signal={s} />
                      : <LockedSignalCard key={s.id} force={s.force} sportLabel="🎾 Tennis" />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Programme groupé par tournoi ───────────────────────────────── */}
        {matches.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-6 text-gray-200">🎾 Programme du jour</h2>
            <div className="space-y-8">
              {sortedMatchTournaments.map(([name, { matches: ms, isMajor }]) => (
                <div key={name}>
                  <TournamentHeader
                    name={name}
                    level={isMajor ? 'Grand Slam' : undefined}
                    count={ms.length}
                    unit="match"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {ms.map(m => <MatchCard key={m.id} match={m} signals={signals} premium={premium} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
