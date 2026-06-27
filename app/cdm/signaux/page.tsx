import Link from 'next/link'
import Header from '@/components/Header'
import { getEntitlement } from '@/lib/entitlement'
import { PaywallNotice } from '@/components/PremiumLock'
import { type PlayerSignal } from '@/lib/cdm-player-signals'
import { getTopByMarketWithBlend } from '@/lib/cdm-signals-blend'
import { getCdMEventsList, getCdMPlayerProps, extractPlayerCote, getCdMOdds, findEvent, extractRealOdds, devigFromEvent } from '@/lib/odds-api'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { generateCdMSignalsForMatch } from '@/lib/football-signals'
import type { Signal, SignalForce } from '@/lib/signals'
import CdmSignauxClient from '@/components/CdmSignauxClient'
import ConseillsMatchClient from './ConseillsMatchClient'

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

function getUpcomingMatchSignals(days = 3, cdmOdds: import('@/lib/odds-api').OddsEvent[] = []): Signal[] {
  const today = new Date().toISOString().slice(0, 10)
  const limit = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
  const upcoming = CDM_FIXTURES.filter(f => f.date >= today && f.date <= limit)
  return upcoming.flatMap(m => generateCdMSignalsForMatch({
    id: m.id, date: m.date, heure: m.heure, domicile: m.domicile, exterieur: m.exterieur,
    devigged: cdmOdds.length ? (() => {
      const ev = findEvent(cdmOdds, m.domicile, m.exterieur)
      return ev ? devigFromEvent(ev, m.domicile, m.exterieur) : undefined
    })() : undefined,
  }))
}

async function enrichMatchSignalsWithOdds(signals: Signal[]): Promise<Signal[]> {
  try {
    const events = await getCdMOdds()
    if (!events.length) return signals
    return signals.map(signal => {
      const parts = signal.match.split(' vs ')
      if (parts.length < 2) return signal
      const event = findEvent(events, parts[0].trim(), parts[1].trim())
      if (!event) return signal
      const realOdds = extractRealOdds(event, signal.typePari, signal.pari)
      if (!realOdds) return signal
      // Mise à jour de la ligne réelle si différente de 2.5 (ex: marché à 3.0)
      let pari = signal.pari
      if (realOdds.ligne != null) {
        const t = signal.typePari.toLowerCase()
        if (t.includes('under')) pari = `UNDER ${realOdds.ligne} buts`
        else if (t.includes('over')) pari = `OVER ${realOdds.ligne} buts`
      }
      return {
        ...signal,
        pari,
        coteRef: realOdds.cote,
        odds: { home: realOdds.home, draw: realOdds.draw, away: realOdds.away, ou: realOdds.ligne, bookmaker: realOdds.bookmaker },
      }
    })
  } catch {
    return signals
  }
}

// ── Helpers visuels (signaux match) ───────────────────────────────────────────

function forceConfig(force: SignalForce, tier?: Signal['tier']) {
  if (tier === 'value') {
    const colors = { fort: 'bg-violet-500/30 text-violet-300 border-violet-400', modéré: 'bg-blue-500/20 text-blue-300 border-blue-400', 'à surveiller': 'bg-indigo-500/20 text-indigo-300 border-indigo-500' }
    return { dot: 'bg-violet-400', badge: `${colors[force]} border`, label: '💰 Value' }
  }
  switch (force) {
    case 'fort':         return { dot: 'bg-violet-400', badge: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', label: '⚡ Fort' }
    case 'modéré':       return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',   label: '🔶 Modéré' }
    case 'à surveiller': return { dot: 'bg-gray-400',    badge: 'bg-gray-700 text-gray-400 border border-gray-600',               label: '👁 Modèle' }
  }
}

function typeColor(typePari: string) {
  if (typePari.includes('Under'))  return 'text-blue-400'
  if (typePari.includes('Over'))   return 'text-orange-400'
  if (typePari.includes('1x2'))    return 'text-violet-400'
  if (typePari.includes('BTTS'))   return 'text-pink-400'
  return 'text-gray-300'
}

function MatchSignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force, signal.tier)
  const isValue = signal.tier === 'value'
  const probPct = signal.stats[0]?.val ? parseFloat(signal.stats[0].val) : null
  const ev = isValue && signal.ev != null
    ? signal.ev / 100
    : (probPct != null && signal.coteRef ? (probPct / 100) * signal.coteRef - 1 : null)

  return (
    <Link
      href={`/cdm/matchup/${signal.id.split('-')[1]}`}
      className={`block bg-[#14171f] rounded-2xl p-4 hover:border-gray-600 transition-colors border ${isValue ? 'border-violet-500/40' : 'border-[#262b36]'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
            {isValue && signal.ev ? `💰 Value +${signal.ev}%` : cfg.label}
          </span>
          <span className={`text-xs font-medium ${typeColor(signal.typePari)}`}>{signal.typePari}</span>
        </div>
        <span className="text-xs text-gray-500">{signal.heure}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{signal.match}</p>
      <p className="font-bold text-white text-sm">{signal.pari}</p>
      {/* Cote + EV (disponibles dès que The Odds API a le match) */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {signal.coteRef && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-mono">
            Cote {signal.coteRef.toFixed(2)}
          </span>
        )}
        {probPct != null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
            P={probPct.toFixed(0)}%
          </span>
        )}
        {ev != null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            ev > 0 ? 'bg-violet-500/20 text-violet-400' : 'bg-red-500/10 text-red-400'
          }`}>
            EV {ev > 0 ? '+' : ''}{(ev * 100).toFixed(1)}%
          </span>
        )}
      </div>
      {signal.odds?.home != null && (
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          <span>1: {signal.odds.home.toFixed(2)}</span>
          {signal.odds.draw != null && <span>X: {signal.odds.draw.toFixed(2)}</span>}
          <span>2: {signal.odds.away?.toFixed(2) ?? '—'}</span>
        </div>
      )}
      <p className="text-xs text-gray-600 mt-2">Voir l'analyse →</p>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CdmSignauxPage() {
  const { premium } = await getEntitlement()
  // Signaux joueurs (blend club + sélection + WC, 30 par marché pour le filtre date client-side)
  const [buteurs, tirsCadrés, cartons, passeurs] = await Promise.all([
    enrichWithCotes(await getTopByMarketWithBlend('buteur', 30)),
    enrichWithCotes(await getTopByMarketWithBlend('tirs-cadrés', 30)),
    enrichWithCotes(await getTopByMarketWithBlend('carton-jaune', 30)),
    enrichWithCotes(await getTopByMarketWithBlend('passeur', 30)),
  ])

  // KPIs basés sur le top 8
  const top8 = [
    ...buteurs.slice(0, 8),
    ...tirsCadrés.slice(0, 8),
    ...cartons.slice(0, 8),
    ...passeurs.slice(0, 8),
  ]
  const totalForts = top8.filter(s => s.force === 'fort').length

  // Cotes CdM pour déviggement + tier value
  const cdmOdds = await getCdMOdds().catch(() => [] as import('@/lib/odds-api').OddsEvent[])
  // Signaux matchs prochains 3 jours — retourne les deux tiers
  const allMatchSignals = await enrichMatchSignalsWithOdds(getUpcomingMatchSignals(3, cdmOdds))
  const signaux = allMatchSignals.filter(s => s.tier === 'probabiliste' || !s.tier)
  const values  = allMatchSignals.filter(s => s.tier === 'value')

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-7xl mx-auto">

        {/* Titre */}
        <div className="mb-2">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">← CdM 2026</Link>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">🌍 Signaux CdM 2026</h1>
          <p className="text-gray-400">
            Props joueurs + signaux matchs — buteur, tirs cadrés, cartons, passes décisives, 1X2, Over/Under.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{top8.length}</p>
            <p className="text-xs text-gray-500 mt-1">Signaux actifs</p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{totalForts}</p>
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
            <div key={t.label} className="bg-[#14171f] border border-[#262b36] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">{t.label}</p>
              <p className="text-sm font-bold text-white">{t.val}</p>
            </div>
          ))}
        </div>

        {premium ? (
          <>
            {/* Conseils du jour — onglets Signaux / Values */}
            <ConseillsMatchClient signaux={signaux} values={values} />

            {/* Signaux joueurs (avec filtre date client-side) */}
            <CdmSignauxClient signals={{ buteurs, tirsCadrés, cartons, passeurs }} />
          </>
        ) : (
          /* Non-premium : aucune donnée de pari envoyée au client, juste l'incitation. */
          <PaywallNotice count={top8.length} />
        )}

        {/* Lien signaux généraux */}
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">⚡ Signaux matchs (Toutes ligues)</p>
            <p className="text-sm text-gray-400">Moneyline, Over/Under, BTTS — MLB, NBA, MLS, Tennis.</p>
          </div>
          <Link href="/signaux"
            className="shrink-0 bg-violet-500 hover:bg-violet-400 text-black font-bold px-5 py-3 rounded-xl transition-colors text-sm">
            Voir →
          </Link>
        </div>
      </div>
    </main>
  )
}
