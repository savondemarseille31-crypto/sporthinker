'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import type { PlayerSignal, PlayerSignalForce, PlayerMarket } from '@/lib/cdm-player-signals'

// ── Types ────────────────────────────────────────────────────────────────────

type DateFilter = 'Aujourd\'hui' | 'Demain' | 'Tous'

type SignalsByMarket = {
  buteurs: PlayerSignal[]
  tirsCadrés: PlayerSignal[]
  cartons: PlayerSignal[]
  passeurs: PlayerSignal[]
}

// ── Helpers visuels ──────────────────────────────────────────────────────────

function forceConfig(force: PlayerSignalForce) {
  switch (force) {
    case 'fort':   return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré': return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',   label: '🔶 Modéré' }
    default:       return { dot: 'bg-gray-400',    badge: 'bg-gray-700 text-gray-400 border border-gray-600',               label: 'Faible' }
  }
}

function confianceLabel(c: PlayerSignal['confiance']) {
  switch (c) {
    case 'haute':   return { text: 'text-emerald-400', label: '● Haute confiance' }
    case 'moyenne': return { text: 'text-yellow-400',  label: '● Confiance moyenne' }
    default:        return { text: 'text-gray-500',    label: '● Petit échantillon' }
  }
}

function marketColor(marché: PlayerMarket) {
  switch (marché) {
    case 'buteur':       return 'text-emerald-400'
    case 'tirs-cadrés':  return 'text-blue-400'
    case 'tirs-tentés':  return 'text-cyan-400'
    case 'carton-jaune': return 'text-yellow-400'
    case 'passeur':      return 'text-purple-400'
  }
}

// ── Carte signal joueur ───────────────────────────────────────────────────────

function PlayerSignalCard({ signal }: { signal: PlayerSignal }) {
  const cfg = forceConfig(signal.force)
  const conf = confianceLabel(signal.confiance)

  return (
    <Link
      href={`/cdm/joueurs/${signal.playerId}`}
      className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
            {cfg.label}
          </span>
          <span className={`text-xs font-medium ${marketColor(signal.marché)}`}>
            {signal.marchéLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {signal.cote && (
            <span className="text-xs bg-gray-800 border border-gray-700 text-white font-bold px-2 py-0.5 rounded-lg">
              {signal.cote.toFixed(2)}
            </span>
          )}
          <span className="text-lg">{signal.flag}</span>
        </div>
      </div>

      <div className="mb-2">
        <p className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
          {signal.playerName}
        </p>
        <p className="text-xs text-gray-500">{signal.poste} · {signal.club}</p>
      </div>

      <div className="bg-gray-800 rounded-xl px-3 py-2 mb-3">
        <p className={`text-lg font-bold ${marketColor(signal.marché)}`}>{signal.valeurClé}</p>
        <p className="text-xs text-gray-500">{signal.seuil}</p>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-3">{signal.raisonnement}</p>

      <div className="grid grid-cols-2 gap-1.5">
        {signal.stats.map((s, i) => (
          <div key={i} className={`rounded-lg px-2 py-1.5 text-center ${s.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.val}</p>
            <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <div className={`mt-3 text-xs ${conf.text}`}>{conf.label}</div>
    </Link>
  )
}

// ── Section marché ────────────────────────────────────────────────────────────

function MarketSection({
  title,
  signals,
  accentClass,
  emptyMsg,
}: {
  title: string
  signals: PlayerSignal[]
  accentClass: string
  emptyMsg: string
}) {
  const forts = signals.filter(s => s.force === 'fort').length
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className={`text-xl font-bold ${accentClass}`}>{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
          {signals.length} signal{signals.length > 1 ? 's' : ''}
        </span>
        {forts > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
            {forts} ⚡ fort{forts > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {signals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {signals.map(s => <PlayerSignalCard key={`${s.playerId}-${s.marché}`} signal={s} />)}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-gray-500 text-sm">{emptyMsg}</p>
        </div>
      )}
    </section>
  )
}

// ── Logique de filtrage par date ──────────────────────────────────────────────

function getNextMatchDate(pays: string, fromDate: string): string | null {
  const fixture = CDM_FIXTURES.find(f =>
    f.date >= fromDate && (f.domicile === pays || f.exterieur === pays)
  )
  return fixture?.date ?? null
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function CdmSignauxClient({ signals }: { signals: SignalsByMarket }) {
  const [filter, setFilter] = useState<DateFilter>('Tous')

  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  // Compte de matchs aujourd'hui / demain pour afficher les onglets pertinents
  const matchesToday = CDM_FIXTURES.filter(f => f.date === today).length
  const matchesTomorrow = CDM_FIXTURES.filter(f => f.date === tomorrow).length

  function applyFilter(sigs: PlayerSignal[]): PlayerSignal[] {
    if (filter === 'Tous') return sigs.slice(0, 8)
    const targetDate = filter === 'Aujourd\'hui' ? today : tomorrow
    return sigs.filter(s => getNextMatchDate(s.pays, today) === targetDate)
  }

  const buteurs   = applyFilter(signals.buteurs)
  const tirsCadrés = applyFilter(signals.tirsCadrés)
  const cartons   = applyFilter(signals.cartons)
  const passeurs  = applyFilter(signals.passeurs)

  const emptyMsg = filter === 'Tous'
    ? 'Aucun signal sur ce marché.'
    : `Aucun joueur de ce marché ne joue ${filter === 'Aujourd\'hui' ? 'aujourd\'hui' : 'demain'}.`

  return (
    <div>
      {/* Filtres date */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(['Aujourd\'hui', 'Demain', 'Tous'] as DateFilter[]).map(f => {
          const count = f === 'Aujourd\'hui' ? matchesToday : f === 'Demain' ? matchesTomorrow : null
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-emerald-500 text-black'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-emerald-500'
              }`}
            >
              {f}
              {count !== null && count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${filter === f ? 'bg-black/20' : 'bg-gray-700'}`}>
                  {count} matchs
                </span>
              )}
              {count !== null && count === 0 && (
                <span className={`text-xs ${filter === f ? 'opacity-60' : 'text-gray-600'}`}>—</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Sections marchés */}
      <MarketSection title="⚽ Buteur du match"  signals={buteurs}    accentClass="text-emerald-300" emptyMsg={emptyMsg} />
      <MarketSection title="🎯 Tirs cadrés (≥ 1)" signals={tirsCadrés} accentClass="text-blue-300"   emptyMsg={emptyMsg} />
      <MarketSection title="🎯 Passeur décisif"  signals={passeurs}   accentClass="text-purple-300"  emptyMsg={emptyMsg} />
      <MarketSection title="🟨 Carton jaune"     signals={cartons}    accentClass="text-yellow-300"  emptyMsg={emptyMsg} />
    </div>
  )
}
