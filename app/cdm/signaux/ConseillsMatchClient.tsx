'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Signal, SignalForce } from '@/lib/signals'

function forceConfig(force: SignalForce, tier?: Signal['tier']) {
  if (tier === 'value') {
    const colors = {
      fort:           'bg-violet-500/30 text-violet-300 border-violet-400',
      modéré:         'bg-blue-500/20 text-blue-300 border-blue-400',
      'à surveiller': 'bg-indigo-500/20 text-indigo-300 border-indigo-500',
    }
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
  if (typePari.includes('Double')) return 'text-yellow-400'
  return 'text-gray-300'
}

function SignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force, signal.tier)
  const isValue = signal.tier === 'value'
  const matchupId = signal.id.split('-')[1]

  return (
    <Link
      href={`/cdm/matchup/${matchupId}`}
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
      <p className="text-xs text-gray-500 mb-1">{signal.match}</p>
      <p className="font-bold text-white text-sm mb-2">{signal.pari}</p>
      {signal.coteRef && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-mono">
          Cote {signal.coteRef.toFixed(2)}
        </span>
      )}
      <p className="text-xs text-gray-600 mt-2">Voir l'analyse →</p>
    </Link>
  )
}

type Props = {
  signaux: Signal[]
  values:  Signal[]
}

export default function ConseillsMatchClient({ signaux, values }: Props) {
  const [tab, setTab] = useState<'signaux' | 'values'>('signaux')

  const activeSignals = tab === 'signaux' ? signaux : values
  const hasValues = values.length > 0

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-5">📋 Conseils du jour</h2>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('signaux')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'signaux'
              ? 'bg-violet-500 text-black'
              : 'bg-[#14171f] border border-gray-700 text-gray-400 hover:border-violet-500'
          }`}
        >
          📊 Signaux
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'signaux' ? 'bg-black/20' : 'bg-gray-800'}`}>
            {signaux.length}
          </span>
        </button>
        <button
          onClick={() => setTab('values')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'values'
              ? 'bg-violet-500 text-black'
              : 'bg-[#14171f] border border-gray-700 text-gray-400 hover:border-violet-500'
          }`}
        >
          💰 Values
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'values' ? 'bg-black/20' : 'bg-gray-800'}`}>
            {values.length}
          </span>
        </button>
      </div>

      {/* Contenu */}
      {tab === 'values' && !hasValues ? (
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-1">Aucune value détectée pour l'instant</p>
          <p className="text-gray-600 text-xs">Les values apparaissent quand l'EV du modèle dépasse +3% vs les cotes du marché.</p>
        </div>
      ) : activeSignals.length === 0 ? (
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm">Aucun signal pour les 3 prochains jours.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeSignals.map(s => <SignalCard key={s.id} signal={s} />)}
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 flex gap-4 text-xs text-gray-600">
        {tab === 'signaux' && <span>📊 Opinion directionnelle du modèle Dixon-Coles (P &gt; 62%)</span>}
        {tab === 'values'  && <span>💰 Edge confirmé vs cotes Pinnacle deviggées (EV &gt; +3%)</span>}
      </div>
    </section>
  )
}
