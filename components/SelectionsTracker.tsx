'use client'
import { useState, useEffect } from 'react'
import {
  getTrackedBets, updateStatut, removeTrackedBet, statsByLevel,
  type TrackedBet, type TrackedStatut, type NiveauEdge,
} from '@/lib/selections-store'

// ── Config ────────────────────────────────────────────────────────────────────

const NIVEAU_CFG: Record<NiveauEdge, { label: string; color: string; bg: string; border: string }> = {
  excellent:   { label: '⚡ Excellent',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  bon:         { label: '✅ Bon',         color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30'    },
  interessant: { label: '🔍 Intéressant', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30'  },
}

const STATUT_CFG: Record<TrackedStatut, { label: string; color: string }> = {
  en_cours: { label: '⏳ En cours', color: 'text-yellow-400' },
  gagné:    { label: '✅ Gagné',    color: 'text-emerald-400' },
  perdu:    { label: '❌ Perdu',    color: 'text-red-400'     },
}

// ── Stats card par niveau ─────────────────────────────────────────────────────

function NiveauCard({ niveau, bets }: { niveau: NiveauEdge; bets: TrackedBet[] }) {
  const cfg   = NIVEAU_CFG[niveau]
  const stats = statsByLevel(bets)[niveau]

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4`}>
      <p className={`text-sm font-bold ${cfg.color} mb-3`}>{cfg.label}</p>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className="text-lg font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Paris suivis</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className={`text-lg font-bold ${stats.roi === null ? 'text-gray-500' : stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.roi === null ? '—' : `${stats.roi >= 0 ? '+' : ''}${stats.roi}%`}
          </p>
          <p className="text-xs text-gray-500">ROI</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className="text-sm font-bold text-white">{stats.gagnes}W / {stats.perdus}L</p>
          <p className="text-xs text-gray-500">Résultats</p>
        </div>
        <div className="bg-gray-900/60 rounded-xl p-2">
          <p className={`text-sm font-bold ${stats.unitesGagnees >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.unitesGagnees >= 0 ? '+' : ''}{stats.unitesGagnees}u
          </p>
          <p className="text-xs text-gray-500">Unités nettes</p>
        </div>
      </div>
    </div>
  )
}

// ── Ligne d'un pari suivi ─────────────────────────────────────────────────────

function BetRow({ bet, onUpdate }: { bet: TrackedBet; onUpdate: () => void }) {
  const cfg    = NIVEAU_CFG[bet.niveau]
  const statut = STATUT_CFG[bet.statut]
  const gain   = bet.statut === 'gagné'
    ? `+${(bet.coteRef - 1).toFixed(2)}u`
    : bet.statut === 'perdu'
    ? '-1.00u'
    : null

  function mark(s: TrackedStatut) { updateStatut(bet.id, s); onUpdate() }
  function remove() { if (confirm('Supprimer ce suivi ?')) { removeTrackedBet(bet.id); onUpdate() } }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
            <span className={`text-xs ${bet.sport === 'WTA' ? 'text-pink-400' : 'text-blue-400'}`}>
              🎾 {bet.sport} · {bet.surface}
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{bet.match}</p>
          <p className="text-sm text-emerald-300">{bet.pari}</p>
          <p className="text-xs text-gray-500 mt-0.5">{bet.date} · {bet.heure} · Cote {bet.coteRef.toFixed(2)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold ${statut.color}`}>{statut.label}</p>
          {gain && (
            <p className={`text-sm font-bold ${bet.statut === 'gagné' ? 'text-emerald-400' : 'text-red-400'}`}>
              {gain}
            </p>
          )}
        </div>
      </div>

      {bet.statut === 'en_cours' && (
        <div className="flex gap-2">
          <button
            onClick={() => mark('gagné')}
            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold py-2 rounded-lg transition-colors"
          >
            ✅ Gagné
          </button>
          <button
            onClick={() => mark('perdu')}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold py-2 rounded-lg transition-colors"
          >
            ❌ Perdu
          </button>
          <button
            onClick={remove}
            className="bg-gray-800 hover:bg-gray-700 text-gray-500 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            🗑
          </button>
        </div>
      )}

      {bet.statut !== 'en_cours' && (
        <button
          onClick={() => mark('en_cours')}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors text-left"
        >
          Remettre en cours ↩
        </button>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function SelectionsTracker() {
  const [bets, setBets] = useState<TrackedBet[]>([])

  useEffect(() => { setBets(getTrackedBets()) }, [])

  const refresh = () => setBets(getTrackedBets())

  const enCours = bets.filter(b => b.statut === 'en_cours')
  const termines = bets.filter(b => b.statut !== 'en_cours')

  if (bets.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p className="text-4xl mb-3">📌</p>
        <p className="text-gray-400 font-semibold mb-1">Aucun pari suivi</p>
        <p className="text-sm">Clique sur &quot;Suivre ce pari&quot; sur une sélection pour démarrer le suivi.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Stats par niveau */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">📊 Performance par niveau d&apos;avantage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['excellent', 'bon', 'interessant'] as NiveauEdge[]).map(n => (
            <NiveauCard key={n} niveau={n} bets={bets} />
          ))}
        </div>
      </div>

      {/* Bilan global */}
      {termines.length > 0 && (() => {
        const allStats = statsByLevel(bets)
        const totalTermines = Object.values(allStats).reduce((s, st) => s + st.gagnes + st.perdus, 0)
        const totalUnites   = Object.values(allStats).reduce((s, st) => s + st.unitesGagnees, 0)
        const roiGlobal     = totalTermines > 0 ? (totalUnites / totalTermines) * 100 : 0
        return (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-400">Bilan global</p>
              <p className="text-lg font-bold text-white">{totalTermines} pari{totalTermines > 1 ? 's' : ''} terminés</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${totalUnites >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalUnites >= 0 ? '+' : ''}{totalUnites.toFixed(2)}u
              </p>
              <p className={`text-sm ${roiGlobal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ROI {roiGlobal >= 0 ? '+' : ''}{roiGlobal.toFixed(1)}%
              </p>
            </div>
          </div>
        )
      })()}

      {/* En cours */}
      {enCours.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-yellow-400 mb-3">⏳ En cours ({enCours.length})</h3>
          <div className="space-y-3">
            {enCours.map(b => <BetRow key={b.id} bet={b} onUpdate={refresh} />)}
          </div>
        </div>
      )}

      {/* Terminés */}
      {termines.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3">Terminés ({termines.length})</h3>
          <div className="space-y-3">
            {termines.map(b => <BetRow key={b.id} bet={b} onUpdate={refresh} />)}
          </div>
        </div>
      )}
    </div>
  )
}
