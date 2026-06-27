'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  getTrackedSignals,
  updateTrackedSignal,
  deleteTrackedSignal,
  updateCoteCloture,
  calcTrackerStats,
  type TrackedSignal,
  type TrackerStats,
  type SignalStatut,
} from '@/lib/signal-tracker'
import { getParis, calcStats, type Pari } from '@/lib/paris-store'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'par-sport' | 'par-marché' | 'historique'

const SPORTS = ['MLB', 'CdM', 'NBA', 'Tennis', 'MLS'] as const
const SPORT_ICONS: Record<string, string> = {
  MLB: '⚾', CdM: '🌍', NBA: '🏀', Tennis: '🎾', MLS: '⚽',
}
const SPORT_COLORS: Record<string, string> = {
  MLB:    'text-blue-400 border-blue-500/30 bg-blue-500/10',
  CdM:    'text-violet-400 border-violet-500/30 bg-violet-500/10',
  NBA:    'text-orange-400 border-orange-500/30 bg-orange-500/10',
  Tennis: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  MLS:    'text-green-400 border-green-500/30 bg-green-500/10',
}

// ── Normalisation marché ──────────────────────────────────────────────────────

function normalizeMarket(typePari: string): string {
  const t = (typePari ?? '').toLowerCase()
  if (t === 'under' || t.includes('under')) return 'Under'
  if (t === 'over'  || t.includes('over'))  return 'Over'
  if (t === 'moneyline')                    return 'Moneyline'
  if (t === '1x2' || t === 'vainqueur' || t.includes('1x2')) return '1X2'
  if (t === 'buteur')                       return 'Buteur'
  if (t === 'tirs-cadrés' || t === 'tirs cadrés') return 'Tirs cadrés'
  if (t === 'tirs-tentés' || t === 'tirs tentés') return 'Tirs tentés'
  if (t === 'carton-jaune' || t === 'carton jaune') return 'Carton jaune'
  if (t === 'passeur')                      return 'Passeur'
  if (t.includes('double chance'))          return 'Double Chance'
  if (t.includes('btts'))                   return 'BTTS'
  if (t.includes('first 5') || t.includes('f5')) return 'First 5'
  return typePari || 'Autre'
}

// ── Helpers visuels ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function StatRow({ label, stats, accentColor }: { label: string; stats: TrackerStats; accentColor: string }) {
  const roiColor  = stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
  const gainColor = stats.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="grid grid-cols-[1fr_repeat(6,_minmax(0,_1fr))] items-center gap-2 px-4 py-3 border-b border-[#262b36]/50 last:border-0 text-sm">
      <span className={`font-semibold ${accentColor}`}>{label}</span>
      <span className="text-center text-gray-300">{stats.total}</span>
      <span className="text-center text-violet-400">{stats.gagnes}</span>
      <span className="text-center text-red-400">{stats.perdus}</span>
      <span className="text-center text-yellow-400">{stats.enCours}</span>
      <span className={`text-center font-bold ${gainColor}`}>
        {stats.totalGain >= 0 ? '+' : ''}{stats.totalGain.toFixed(1)}u
      </span>
      <span className={`text-center font-bold ${roiColor}`}>
        {stats.roi >= 0 ? '+' : ''}{stats.roi}%
      </span>
    </div>
  )
}

// ── Tab: Dashboard ────────────────────────────────────────────────────────────

function TabDashboard({ signals, paris }: { signals: TrackedSignal[]; paris: Pari[] }) {
  const globalStats   = calcTrackerStats(signals)
  const fortsStats    = calcTrackerStats(signals.filter(s => s.force === 'fort'))
  const moderésStats  = calcTrackerStats(signals.filter(s => s.force === 'modéré'))
  const parisStats    = calcStats(paris)

  // Évolution P&L cumulé (signaux)
  const termines = [...signals]
    .filter(s => s.statut === 'gagné' || s.statut === 'perdu')
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
  let cumul = 0
  const evolution = termines.map(s => { cumul += s.gain ?? 0; return cumul })

  const roiColor  = globalStats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
  const gainColor = globalStats.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div>
      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Signaux suivis"  value={globalStats.total}     sub={`${globalStats.enCours} en cours`} />
        <KpiCard label="✅ Gagnés"       value={globalStats.gagnes}    color="text-violet-400" />
        <KpiCard label="❌ Perdus"       value={globalStats.perdus}    color="text-red-400" />
        <KpiCard label="P&L (unités)"    value={`${globalStats.totalGain >= 0 ? '+' : ''}${globalStats.totalGain.toFixed(1)}u`} color={gainColor} />
        <KpiCard label="ROI"             value={`${globalStats.roi >= 0 ? '+' : ''}${globalStats.roi}%`} color={roiColor} sub={`${globalStats.txReussite}% réussite`} />
      </div>

      {/* Fort vs Modéré */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { title: '⚡ Signaux forts',   stats: fortsStats,   accent: 'border-violet-500/30 bg-violet-500/5' },
          { title: '🔶 Signaux modérés', stats: moderésStats, accent: 'border-yellow-500/30  bg-yellow-500/5'  },
        ].map(({ title, stats, accent }) => (
          <div key={title} className={`border ${accent} rounded-2xl p-5`}>
            <h3 className="font-bold text-white mb-4">{title}</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'P&L',      val: `${stats.totalGain >= 0 ? '+' : ''}${stats.totalGain.toFixed(1)}u`, color: stats.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'ROI',      val: `${stats.roi >= 0 ? '+' : ''}${stats.roi}%`,                        color: stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Réussite', val: `${stats.txReussite}%`,                                              color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{stats.total} signaux · {stats.termines} terminés · {stats.enCours} en cours</span>
            </div>
          </div>
        ))}
      </div>

      {/* P&L évolution */}
      {evolution.length > 1 && (
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-violet-400">📈 Évolution P&L (signaux)</h3>
            <span className={`text-sm font-bold ${cumul >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {cumul >= 0 ? '+' : ''}{cumul.toFixed(2)}u
            </span>
          </div>
          <div className="flex items-end gap-0.5 h-16">
            {evolution.map((val, i) => {
              const max = Math.max(...evolution.map(Math.abs), 1)
              return (
                <div key={i} className="flex-1 flex flex-col justify-end" title={`${val >= 0 ? '+' : ''}${val.toFixed(2)}u`}>
                  <div className={`rounded-sm ${val >= 0 ? 'bg-violet-500' : 'bg-red-500'}`}
                    style={{ height: `${Math.max(Math.abs(val) / max * 100, 4)}%` }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1er signal</span>
            <span>Dernier ({evolution.length})</span>
          </div>
        </div>
      )}

      {/* Paris perso résumé */}
      {paris.length > 0 && (
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">💰 Paris personnels</h3>
            <Link href="/paris/historique" className="text-xs text-gray-500 hover:text-violet-400 transition-colors">
              Détail →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { label: 'Total', val: String(parisStats.total) },
              { label: 'Réussite', val: `${parisStats.txReussite}%` },
              { label: 'ROI', val: `${parisStats.roi >= 0 ? '+' : ''}${parisStats.roi}%`, color: parisStats.roi >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'P&L', val: `${parisStats.totalGain >= 0 ? '+' : ''}${parisStats.totalGain.toFixed(2)}€`, color: parisStats.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-lg font-bold ${s.color ?? 'text-white'}`}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {signals.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-xl font-semibold mb-2">Aucun signal suivi</p>
          <p className="text-sm mb-6 max-w-sm mx-auto">
            Clique sur "Suivre ce signal" sur les cartes de la page Signaux ou CdM pour commencer.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signaux" className="bg-violet-500 hover:bg-violet-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Signaux matchs →
            </Link>
            <Link href="/cdm/signaux" className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Signaux CdM →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Par sport ────────────────────────────────────────────────────────────

function TabParSport({ signals }: { signals: TrackedSignal[] }) {
  const sports = SPORTS.filter(s => signals.some(sig => sig.sport === s))
  const withData = sports.length > 0 ? sports : (SPORTS as unknown as string[])

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SPORTS.map(sport => {
          const ss    = signals.filter(s => s.sport === sport)
          const stats = calcTrackerStats(ss)
          const col   = SPORT_COLORS[sport] ?? 'text-gray-400 border-gray-700 bg-gray-800'
          const gainColor = stats.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'
          const roiColor  = stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'

          return (
            <div key={sport} className={`border rounded-2xl p-5 ${col}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{SPORT_ICONS[sport]}</span>
                <h3 className="font-bold text-lg">{sport}</h3>
                <span className="ml-auto text-xs opacity-60">{stats.total} signaux</span>
              </div>

              {stats.total === 0 ? (
                <p className="text-xs opacity-50 text-center py-4">Aucun signal suivi</p>
              ) : (
                <>
                  {/* Stats globales sport */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-black/20 rounded-xl p-3 text-center">
                      <p className="text-xs opacity-60 mb-1">P&L</p>
                      <p className={`text-xl font-bold ${gainColor}`}>
                        {stats.totalGain >= 0 ? '+' : ''}{stats.totalGain.toFixed(1)}u
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 text-center">
                      <p className="text-xs opacity-60 mb-1">ROI</p>
                      <p className={`text-xl font-bold ${roiColor}`}>
                        {stats.roi >= 0 ? '+' : ''}{stats.roi}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs mb-3">
                    {[
                      { l: '✅', v: stats.gagnes },
                      { l: '❌', v: stats.perdus },
                      { l: '⏳', v: stats.enCours },
                    ].map(({ l, v }) => (
                      <div key={l} className="bg-black/20 rounded-lg py-1.5">
                        <p className="opacity-50">{l}</p>
                        <p className="font-bold">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Split Fort / Modéré */}
                  {(() => {
                    const fStats = calcTrackerStats(ss.filter(s => s.force === 'fort'))
                    const mStats = calcTrackerStats(ss.filter(s => s.force === 'modéré'))
                    return (
                      <div className="border-t border-white/10 pt-3 space-y-1.5">
                        {[
                          { label: '⚡ Forts',    stats: fStats, count: ss.filter(s => s.force === 'fort').length },
                          { label: '🔶 Modérés', stats: mStats, count: ss.filter(s => s.force === 'modéré').length },
                        ].map(({ label, stats: fs, count }) => count === 0 ? null : (
                          <div key={label} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-1.5">
                            <span className="opacity-70">{label} <span className="opacity-50">({count})</span></span>
                            <span className={`font-bold ${fs.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {fs.gagnes}G/{fs.perdus}P · ROI {fs.roi >= 0 ? '+' : ''}{fs.roi}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  <p className="text-xs opacity-50 text-center mt-2">{stats.txReussite}% réussite · cote moy. {stats.coteMoyenne || '—'}</p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Par marché ───────────────────────────────────────────────────────────

function TabParMarché({ signals }: { signals: TrackedSignal[] }) {
  // Grouper par marché normalisé
  const byMarket = signals.reduce<Record<string, TrackedSignal[]>>((acc, s) => {
    const m = normalizeMarket(s.typePari)
    ;(acc[m] ??= []).push(s)
    return acc
  }, {})

  const rows = Object.entries(byMarket)
    .map(([marché, sigs]) => ({ marché, stats: calcTrackerStats(sigs) }))
    .sort((a, b) => b.stats.roi - a.stats.roi)

  if (!rows.length) {
    return <p className="text-gray-500 text-center py-12">Aucun signal suivi.</p>
  }

  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl overflow-hidden">
      {/* En-tête */}
      <div className="grid grid-cols-[1fr_repeat(6,_minmax(0,_1fr))] gap-2 px-4 py-3 bg-gray-800/50 text-xs text-gray-500 font-medium uppercase tracking-wide">
        <span>Marché</span>
        <span className="text-center">Total</span>
        <span className="text-center">✅</span>
        <span className="text-center">❌</span>
        <span className="text-center">⏳</span>
        <span className="text-center">P&L</span>
        <span className="text-center">ROI</span>
      </div>

      {/* Total global */}
      <StatRow label="🌐 Tous marchés" stats={calcTrackerStats(signals)} accentColor="text-white" />

      {/* Par marché */}
      {rows.map(({ marché, stats }) => (
        <StatRow key={marché} label={marché} stats={stats} accentColor="text-gray-300" />
      ))}
    </div>
  )
}

// ── Tab: Historique ───────────────────────────────────────────────────────────

function TabHistorique({ signals, onRefresh }: { signals: TrackedSignal[]; onRefresh: () => void }) {
  const [sport,      setSport]     = useState<string>('Tous')
  const [statut,     setStatut]    = useState<string>('Tous')
  const [force,      setForce]     = useState<string>('Tous')
  const [editId,     setEditId]    = useState<string | null>(null)
  const [clvEditId,  setClvEditId] = useState<string | null>(null)
  const [clvInput,   setClvInput]  = useState('')

  function handleStatut(id: string, s: SignalStatut) {
    updateTrackedSignal(id, { statut: s })
    onRefresh()
    setEditId(null)
  }

  function handleDelete(id: string) {
    deleteTrackedSignal(id)
    onRefresh()
  }

  function handleCLV(id: string) {
    const val = parseFloat(clvInput.replace(',', '.'))
    if (isNaN(val) || val <= 1) return
    updateCoteCloture(id, val)
    onRefresh()
    setClvEditId(null)
    setClvInput('')
  }

  const filtered = signals.filter(s => {
    if (sport  !== 'Tous' && s.sport  !== sport)  return false
    if (statut !== 'Tous' && s.statut !== statut) return false
    if (force  !== 'Tous' && s.force  !== force)  return false
    return true
  })

  const byDate = filtered.reduce<Record<string, TrackedSignal[]>>((acc, s) => {
    ;(acc[s.date] ??= []).push(s)
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-6">
        {/* Sport */}
        <select value={sport} onChange={e => setSport(e.target.value)}
          className="bg-[#14171f] border border-[#262b36] rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500">
          <option>Tous</option>
          {SPORTS.map(s => <option key={s}>{s}</option>)}
        </select>
        {/* Force */}
        <select value={force} onChange={e => setForce(e.target.value)}
          className="bg-[#14171f] border border-[#262b36] rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500">
          <option>Tous</option>
          <option value="fort">⚡ Forts</option>
          <option value="modéré">🔶 Modérés</option>
        </select>
        {/* Statut */}
        <select value={statut} onChange={e => setStatut(e.target.value)}
          className="bg-[#14171f] border border-[#262b36] rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500">
          <option>Tous</option>
          <option value="en_cours">⏳ En cours</option>
          <option value="gagné">✅ Gagnés</option>
          <option value="perdu">❌ Perdus</option>
          <option value="annulé">🚫 Annulés</option>
        </select>
        <span className="text-xs text-gray-600 self-center ml-auto">{filtered.length} signal{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aucun signal pour ces filtres.</p>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3 capitalize">
                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-2">
                {byDate[date].sort((a, b) => {
                  const order = { fort: 0, modéré: 1, 'à surveiller': 2 }
                  return (order[a.force] ?? 2) - (order[b.force] ?? 2)
                }).map(signal => (
                  <div key={signal.id} className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SPORT_COLORS[signal.sport] ?? 'bg-gray-700 text-gray-400'}`}>
                            {SPORT_ICONS[signal.sport] ?? ''} {signal.sport}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            signal.force === 'fort'   ? 'bg-violet-500/20 text-violet-400' :
                            signal.force === 'modéré' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {signal.force === 'fort' ? '⚡ Fort' : signal.force === 'modéré' ? '🔶 Modéré' : '👁 Surveiller'}
                          </span>
                          <span className="text-xs text-gray-500">{normalizeMarket(signal.typePari)}</span>
                        </div>
                        <p className="font-semibold text-sm text-white">{signal.pari}</p>
                        <p className="text-xs text-gray-400">{signal.match}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-sm font-bold text-white bg-gray-800 px-3 py-1 rounded-lg">
                          @{signal.cote.toFixed(2)}
                        </span>
                        {signal.statut === 'en_cours' ? (
                          editId === signal.id ? (
                            <div className="flex gap-1.5">
                              {(['gagné', 'perdu', 'annulé'] as SignalStatut[]).map(s => (
                                <button key={s} onClick={() => handleStatut(signal.id, s)}
                                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                                    s === 'gagné'  ? 'bg-violet-500/20 hover:bg-violet-500/40 text-violet-400' :
                                    s === 'perdu'  ? 'bg-red-500/20 hover:bg-red-500/40 text-red-400' :
                                    'bg-gray-700 hover:bg-gray-600 text-gray-400'
                                  }`}>
                                  {s === 'gagné' ? '✅' : s === 'perdu' ? '❌' : '↩'}
                                </button>
                              ))}
                              <button onClick={() => setEditId(null)} className="text-xs text-gray-600 px-1 hover:text-gray-300">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setEditId(signal.id)}
                              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                              Résultat
                            </button>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              signal.statut === 'gagné'  ? 'bg-violet-500/20 text-violet-400' :
                              signal.statut === 'perdu'  ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {signal.statut === 'gagné'  ? `+${signal.gain?.toFixed(2)}u` :
                               signal.statut === 'perdu'  ? '−1.00u' : 'Annulé'}
                            </span>
                            <button onClick={() => handleStatut(signal.id, 'en_cours')}
                              className="text-xs text-gray-600 hover:text-gray-300 px-1 transition-colors" title="Remettre en cours">
                              ↺
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#262b36] flex items-center justify-between gap-3">
                      {/* CLV — Closing Line Value */}
                      <div className="flex items-center gap-2">
                        {signal.clv != null ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            signal.clv > 0 ? 'bg-violet-500/20 text-violet-400' : 'bg-red-500/10 text-red-400'
                          }`} title={`Cote ouv. ${signal.cote.toFixed(2)} / Cote clôt. ${signal.coteCloture?.toFixed(2)}`}>
                            CLV {signal.clv > 0 ? '+' : ''}{(signal.clv * 100).toFixed(1)}%
                          </span>
                        ) : signal.statut !== 'en_cours' && (
                          clvEditId === signal.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number" step="0.01" min="1.01" placeholder="Cote clôture"
                                value={clvInput} onChange={e => setClvInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCLV(signal.id)}
                                className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                                autoFocus
                              />
                              <button onClick={() => handleCLV(signal.id)}
                                className="text-xs bg-violet-500/20 text-violet-400 px-2 py-1 rounded-lg hover:bg-violet-500/40 transition-colors">
                                OK
                              </button>
                              <button onClick={() => { setClvEditId(null); setClvInput('') }}
                                className="text-xs text-gray-600 hover:text-gray-300 px-1">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setClvEditId(signal.id); setClvInput('') }}
                              className="text-xs text-gray-600 hover:text-blue-400 transition-colors"
                              title="Enregistrer la cote de clôture pour calculer le CLV">
                              + CLV
                            </button>
                          )
                        )}
                      </div>
                      <button onClick={() => handleDelete(signal.id)}
                        className="text-xs text-gray-700 hover:text-red-400 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function SuiviPage() {
  const [tab,     setTab]     = useState<Tab>('dashboard')
  const [signals, setSignals] = useState<TrackedSignal[]>([])
  const [paris,   setParis]   = useState<Pari[]>([])

  function refresh() {
    setSignals(getTrackedSignals())
    getParis().then(setParis)
  }

  useEffect(() => { refresh() }, [])

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard',  label: '📊 Tableau de bord' },
    { id: 'par-sport',  label: '🏅 Par sport'        },
    { id: 'par-marché', label: '🎯 Par marché'        },
    { id: 'historique', label: '📋 Historique'        },
  ]

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">📊 Suivi &amp; Performance</h1>
          <p className="text-gray-400">
            Tous tes signaux suivis — ROI, P&L et taux de réussite par sport et par marché.
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 flex-wrap mb-8 border-b border-[#262b36] pb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-violet-500 text-black'
                  : 'bg-[#14171f] border border-[#262b36] text-gray-400 hover:border-violet-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu onglet */}
        {tab === 'dashboard'  && <TabDashboard  signals={signals} paris={paris} />}
        {tab === 'par-sport'  && <TabParSport   signals={signals} />}
        {tab === 'par-marché' && <TabParMarché  signals={signals} />}
        {tab === 'historique' && <TabHistorique signals={signals} onRefresh={refresh} />}

        {/* Liens utiles */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#262b36] pt-8">
          <Link href="/signaux" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 hover:border-violet-500 transition-colors">
            <p className="font-semibold mb-1">⚡ Signaux matchs</p>
            <p className="text-xs text-gray-500">MLB, NBA, Tennis, MLS, CdM</p>
          </Link>
          <Link href="/cdm/signaux" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 hover:border-violet-500 transition-colors">
            <p className="font-semibold mb-1">🌍 Signaux CdM</p>
            <p className="text-xs text-gray-500">Props joueurs · buteur, tirs, cartons</p>
          </Link>
          <Link href="/paris/historique" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 hover:border-violet-500 transition-colors">
            <p className="font-semibold mb-1">💰 Paris personnels</p>
            <p className="text-xs text-gray-500">Historique · bankroll · ROI €</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
