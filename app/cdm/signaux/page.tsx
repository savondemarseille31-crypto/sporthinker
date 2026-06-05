import Link from 'next/link'
import Header from '@/components/Header'
import { getTopByMarket, type PlayerSignal } from '@/lib/cdm-player-signals'
import { getCdMEventsList, getCdMPlayerProps, extractPlayerCote } from '@/lib/odds-api'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { generateCdMSignalsForMatch } from '@/lib/football-signals'
import type { Signal, SignalForce } from '@/lib/signals'
import CdmSignauxClient from '@/components/CdmSignauxClient'

export const revalidate = 3600

// ── Enrichissement cotes ──────────────────────────────────────────────────────

function normTeam(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

function teamContainsPays(teamName: string, pays: string): boolean {
  const nt = normTeam(teamName), np = normTeam(pays)
  return nt === np || nt.includes(np) || np.includes(nt)
}

async function enrichWithCotes(signals: PlayerSignal[]): Promise<PlayerSignal[]> {
  try {
    const events = await getCdMEventsList()
    if (!events.length) return signals

    const today = new Date().toISOString().slice(0, 10)
    const propsCache = new Map<string, Awaited<ReturnType<typeof getCdMPlayerProps>>>()

    return await Promise.all(signals.map(async (signal) => {
      const fixture = CDM_FIXTURES.find(f =>
        f.date >= today &&
        (teamContainsPays(f.domicile, signal.pays) || teamContainsPays(f.exterieur, signal.pays))
      )
      if (!fixture) return signal

      const event = events.find(e =>
        (teamContainsPays(e.home_team, fixture.domicile) && teamContainsPays(e.away_team, fixture.exterieur)) ||
        (teamContainsPays(e.home_team, fixture.exterieur) && teamContainsPays(e.away_team, fixture.domicile))
      )
      if (!event) return signal

      if (!propsCache.has(event.id)) {
        propsCache.set(event.id, await getCdMPlayerProps(event.id))
      }
      const props = propsCache.get(event.id)
      if (!props) return signal

      const cote = extractPlayerCote(props, signal.playerName, signal.marché)
      return cote ? { ...signal, cote } : signal
    }))
  } catch {
    return signals
  }
}

// ── Signaux matchs prochains jours ────────────────────────────────────────────

function getUpcomingMatchSignals(days = 3): Signal[] {
  const today = new Date().toISOString().slice(0, 10)
  const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
  const upcoming = CDM_FIXTURES.filter(f => f.date >= today && f.date <= limit)
  return upcoming.flatMap(m => generateCdMSignalsForMatch({
    id: m.id, date: m.date, heure: m.heure, domicile: m.domicile, exterieur: m.exterieur,
  }))
}

// ── Helpers visuels (signaux match) ───────────────────────────────────────────

function forceConfig(force: SignalForce) {
  switch (force) {
    case 'fort':         return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré':       return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',   label: '🔶 Modéré' }
    case 'à surveiller': return { dot: 'bg-gray-400',    badge: 'bg-gray-700 text-gray-400 border border-gray-600',               label: '👁 À surveiller' }
  }
}

function typeColor(typePari: string) {
  if (typePari.includes('Under'))  return 'text-blue-400'
  if (typePari.includes('Over'))   return 'text-orange-400'
  if (typePari.includes('1x2'))    return 'text-emerald-400'
  if (typePari.includes('BTTS'))   return 'text-pink-400'
  return 'text-gray-300'
}

function MatchSignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force)
  return (
    <Link
      href={`/cdm/matchup/${signal.id.split('-')[1]}`}
      className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
            {cfg.label}
          </span>
          <span className={`text-xs font-medium ${typeColor(signal.typePari)}`}>{signal.typePari}</span>
        </div>
        <span className="text-xs text-gray-500">{signal.heure}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{signal.match}</p>
      <p className="font-bold text-white text-sm">{signal.pari}</p>
      <p className="text-xs text-gray-500 mt-2">Voir l'analyse →</p>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CdmSignauxPage() {
  // Signaux joueurs (30 par marché pour le filtre date client-side)
  const [buteurs, tirsCadrés, cartons, passeurs] = await Promise.all([
    enrichWithCotes(getTopByMarket('buteur', 30)),
    enrichWithCotes(getTopByMarket('tirs-cadrés', 30)),
    enrichWithCotes(getTopByMarket('carton-jaune', 30)),
    enrichWithCotes(getTopByMarket('passeur', 30)),
  ])

  // KPIs basés sur le top 8
  const top8 = [
    ...buteurs.slice(0, 8),
    ...tirsCadrés.slice(0, 8),
    ...cartons.slice(0, 8),
    ...passeurs.slice(0, 8),
  ]
  const totalForts = top8.filter(s => s.force === 'fort').length

  // Signaux matchs prochains 3 jours
  const matchSignals = getUpcomingMatchSignals(3)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-7xl mx-auto">

        {/* Titre */}
        <div className="mb-2">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← CdM 2026</Link>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">🌍 Signaux CdM 2026</h1>
          <p className="text-gray-400">
            Props joueurs + signaux matchs — buteur, tirs cadrés, cartons, passes décisives, 1X2, Over/Under.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{top8.length}</p>
            <p className="text-xs text-gray-500 mt-1">Signaux actifs</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{totalForts}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Forts</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{buteurs.slice(0, 8).filter(s => s.force === 'fort').length}</p>
            <p className="text-xs text-gray-500 mt-1">⚽ Buteurs forts</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{cartons.slice(0, 8).filter(s => s.force === 'fort').length}</p>
            <p className="text-xs text-gray-500 mt-1">🟨 Cartons à risque</p>
          </div>
        </div>

        {/* Avertissement source données */}
        <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300 flex gap-3 items-start">
          <span className="text-lg mt-0.5 shrink-0">ℹ️</span>
          <div>
            <p className="font-semibold mb-1">Source des données</p>
            <p className="text-blue-400/80">
              Signaux calculés sur les stats de <span className="text-white font-medium">club (saison 2024-25)</span>.
              Une fois la compétition lancée (11 juin), les stats seront enrichies avec les données temps réel API-Football.
              La confiance est proportionnelle au nombre de matchs joués.
            </p>
          </div>
        </div>

        {/* Seuils de référence */}
        <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '⚽ Buteur fort', val: '≥ 0.40 xG/match' },
            { label: '🎯 Cadré fort', val: '≥ 1.40/match' },
            { label: '🟨 Carton élevé', val: '≥ 22% des matchs' },
            { label: '🎯 Passeur fort', val: '≥ 0.33 xA/match' },
          ].map(t => (
            <div key={t.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">{t.label}</p>
              <p className="text-sm font-bold text-white">{t.val}</p>
            </div>
          ))}
        </div>

        {/* Signaux matchs */}
        {matchSignals.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-emerald-400">⚽ Signaux Matchs (3 prochains jours)</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                {matchSignals.length} signal{matchSignals.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {matchSignals.map(s => <MatchSignalCard key={s.id} signal={s} />)}
            </div>
          </section>
        )}

        {/* Signaux joueurs (avec filtre date client-side) */}
        <CdmSignauxClient signals={{ buteurs, tirsCadrés, cartons, passeurs }} />

        {/* Lien signaux généraux */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">⚡ Signaux matchs (Toutes ligues)</p>
            <p className="text-sm text-gray-400">Moneyline, Over/Under, BTTS — MLB, NBA, MLS, Tennis.</p>
          </div>
          <Link href="/signaux"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 rounded-xl transition-colors text-sm">
            Voir →
          </Link>
        </div>
      </div>
    </main>
  )
}
