'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  getTrackedSignals,
  updateTrackedSignal,
  deleteTrackedSignal,
  calcTrackerStats,
  type TrackedSignal,
  type TrackerStats,
  type SignalStatut,
} from '@/lib/signal-tracker'

function SportBadge({ sport }: { sport: TrackedSignal['sport'] }) {
  const styles: Record<string, string> = {
    MLB:    'bg-blue-500/10 text-blue-300',
    CdM:    'bg-violet-500/10 text-violet-300',
    NBA:    'bg-orange-500/10 text-orange-300',
    Tennis: 'bg-yellow-500/10 text-yellow-300',
  }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[sport] ?? 'bg-gray-700 text-gray-400'}`}>
      {sport}
    </span>
  )
}

function ForceBadge({ force }: { force: TrackedSignal['force'] }) {
  if (force === 'fort')    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">⚡ Fort</span>
  if (force === 'modéré')  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">🔶 Modéré</span>
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">👁 Surveiller</span>
}

function StatCard({
  title,
  stats,
  color,
}: {
  title: string
  stats: TrackerStats
  color: 'violet' | 'yellow'
}) {
  const c = color === 'violet'
    ? { accent: 'text-violet-400', border: 'border-violet-500/30', chip: 'bg-violet-500/10' }
    : { accent: 'text-yellow-400',  border: 'border-yellow-500/30',  chip: 'bg-yellow-500/10' }

  const roiColor  = stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
  const gainColor = stats.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className={`bg-[#14171f] border ${c.border} rounded-2xl p-5`}>
      <h2 className={`text-lg font-bold ${c.accent} mb-4`}>{title}</h2>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className={`${c.chip} rounded-xl p-3 text-center`}>
          <p className="text-xs text-gray-400 mb-1">P&amp;L</p>
          <p className={`text-xl font-bold ${gainColor}`}>
            {stats.totalGain >= 0 ? '+' : ''}{stats.totalGain.toFixed(2)}u
          </p>
        </div>
        <div className={`${c.chip} rounded-xl p-3 text-center`}>
          <p className="text-xs text-gray-400 mb-1">ROI</p>
          <p className={`text-xl font-bold ${roiColor}`}>
            {stats.roi >= 0 ? '+' : ''}{stats.roi}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Total',    val: stats.total,       color: 'text-white' },
          { label: 'Gagnés',   val: stats.gagnes,      color: 'text-violet-400' },
          { label: 'Perdus',   val: stats.perdus,      color: 'text-red-400' },
          { label: 'En cours', val: stats.enCours,     color: 'text-yellow-400' },
          { label: 'Réussite', val: `${stats.txReussite}%`, color: 'text-white' },
          { label: 'Cote moy.', val: stats.coteMoyenne || '—', color: 'text-white' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-gray-800/50 rounded-lg py-2">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SignalRow({ signal, onUpdate, onDelete }: {
  signal: TrackedSignal
  onUpdate: () => void
  onDelete: (id: string) => void
}) {
  const [editingCote, setEditingCote] = useState(false)
  const [coteInput, setCoteInput] = useState(String(signal.cote))

  function setStatut(statut: SignalStatut) {
    updateTrackedSignal(signal.id, { statut })
    onUpdate()
  }

  function saveCote() {
    const val = parseFloat(coteInput)
    if (!isNaN(val) && val > 1) {
      updateTrackedSignal(signal.id, { cote: val })
      onUpdate()
    }
    setEditingCote(false)
  }

  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <SportBadge sport={signal.sport} />
            <ForceBadge force={signal.force} />
            <span className="text-xs text-gray-500">{signal.typePari}</span>
          </div>
          <p className="font-semibold text-white text-sm mb-0.5">{signal.pari}</p>
          <p className="text-xs text-gray-400">{signal.match}</p>
        </div>

        {/* Cote + Statut */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {editingCote ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={coteInput}
                onChange={e => setCoteInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveCote(); if (e.key === 'Escape') setEditingCote(false) }}
                className="w-20 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500"
                autoFocus
              />
              <button onClick={saveCote} className="text-xs bg-violet-500 text-black px-2 py-1 rounded-lg font-bold">OK</button>
              <button onClick={() => setEditingCote(false)} className="text-xs text-gray-500 hover:text-white px-1">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingCote(true); setCoteInput(String(signal.cote)) }}
              className="text-sm font-bold text-white bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors"
              title="Modifier la cote"
            >
              @{signal.cote.toFixed(2)}
            </button>
          )}

          {signal.statut === 'en_cours' ? (
            <div className="flex gap-1.5">
              <button onClick={() => setStatut('gagné')}
                className="text-xs bg-violet-500/20 hover:bg-violet-500/40 text-violet-400 px-2.5 py-1 rounded-lg font-semibold transition-colors">
                ✅ Gagné
              </button>
              <button onClick={() => setStatut('perdu')}
                className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2.5 py-1 rounded-lg font-semibold transition-colors">
                ❌ Perdu
              </button>
              <button onClick={() => setStatut('annulé')}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-400 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                title="Annulé / void">
                ↩
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                signal.statut === 'gagné'  ? 'bg-violet-500/20 text-violet-400' :
                signal.statut === 'perdu'  ? 'bg-red-500/20 text-red-400' :
                'bg-gray-700 text-gray-400'
              }`}>
                {signal.statut === 'gagné'  ? `+${signal.gain?.toFixed(2)}u` :
                 signal.statut === 'perdu'  ? '−1.00u' :
                 'Annulé'}
              </span>
              <button
                onClick={() => setStatut('en_cours')}
                className="text-xs text-gray-600 hover:text-gray-300 transition-colors px-1"
                title="Remettre en cours">
                ↺
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#262b36] flex justify-end">
        <button
          onClick={() => onDelete(signal.id)}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors">
          Supprimer
        </button>
      </div>
    </div>
  )
}

export default function SignauxSuiviPage() {
  const [signals, setSignals] = useState<TrackedSignal[]>([])

  useEffect(() => { setSignals(getTrackedSignals()) }, [])

  function refresh() { setSignals(getTrackedSignals()) }

  function handleDelete(id: string) {
    deleteTrackedSignal(id)
    refresh()
  }

  const fortsSignals   = signals.filter(s => s.force === 'fort')
  const moderésSignals = signals.filter(s => s.force === 'modéré')
  const fortsStats     = calcTrackerStats(fortsSignals)
  const moderésStats   = calcTrackerStats(moderésSignals)

  // Groupement par date match (desc)
  const byDate = signals.reduce<Record<string, TrackedSignal[]>>((acc, s) => {
    ;(acc[s.date] ??= []).push(s)
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  function fmtDate(str: string) {
    return new Date(str).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/signaux" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">
            ← Retour aux signaux
          </Link>
          <h1 className="text-4xl font-bold mt-3 mb-1">📊 Suivi algorithme</h1>
          <p className="text-gray-400">
            Performance historique des signaux — 1 unité par signal, cote modifiable
          </p>
        </div>

        {signals.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-xl font-semibold mb-2">Aucun signal enregistré</p>
            <p className="text-sm mb-6 max-w-sm mx-auto">
              Retourne sur la page Signaux, clique sur &quot;Enregistrer&quot; puis reviens ici pour marquer les résultats.
            </p>
            <Link href="/signaux"
              className="bg-violet-500 hover:bg-violet-400 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Voir les signaux du jour →
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Fort vs Modéré */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <StatCard title="⚡ Signaux forts"   stats={fortsStats}   color="violet" />
              <StatCard title="🔶 Signaux modérés" stats={moderésStats} color="yellow" />
            </div>

            {/* Liste par date */}
            <div className="space-y-8">
              {sortedDates.map(date => (
                <div key={date}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 capitalize">
                    {fmtDate(date)}
                  </h2>
                  <div className="space-y-3">
                    {byDate[date]
                      .sort((a, b) => {
                        const order = { fort: 0, modéré: 1, 'à surveiller': 2 }
                        return order[a.force] - order[b.force]
                      })
                      .map(signal => (
                        <SignalRow
                          key={signal.id}
                          signal={signal}
                          onUpdate={refresh}
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
