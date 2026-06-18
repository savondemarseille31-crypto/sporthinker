'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  getParis, updatePari, deletePari, getBankroll, calcStats,
  type Pari, type Bankroll, type StatutPari
} from '@/lib/paris-store'

const STATUT_LABELS: Record<StatutPari, string> = {
  en_cours: '⏳ En cours',
  gagné: '✅ Gagné',
  perdu: '❌ Perdu',
  annulé: '🚫 Annulé',
}

const STATUT_COLORS: Record<StatutPari, string> = {
  en_cours: 'bg-yellow-500/20 text-yellow-400',
  gagné: 'bg-emerald-500/20 text-emerald-400',
  perdu: 'bg-red-500/20 text-red-400',
  annulé: 'bg-gray-700 text-gray-400',
}

export default function HistoriquePage() {
  const [paris, setParis] = useState<Pari[]>([])
  const [bankroll, setBankroll] = useState<Bankroll>({ montantInitial: 1000, montantActuel: 1000, devise: '€' })
  const [filtre, setFiltre] = useState<StatutPari | 'tous'>('tous')
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    getParis().then(setParis)
    getBankroll().then(setBankroll)
  }, [])

  const refresh = () => { getParis().then(setParis) }

  const handleStatut = async (id: string, statut: StatutPari) => {
    await updatePari(id, { statut })
    refresh()
    setEditId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce pari ?')) return
    await deletePari(id)
    refresh()
  }

  const filtered = paris.filter(p => filtre === 'tous' || p.statut === filtre)
  const stats = calcStats(paris)

  // Evolution bankroll au fil du temps (cumulatif)
  const termines = [...paris]
    .filter(p => p.statut === 'gagné' || p.statut === 'perdu')
    .reverse()
  let cumul = 0
  const evolution = termines.map(p => {
    cumul += p.gain ?? 0
    return cumul
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/paris" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour Paris</Link>
            <h1 className="text-3xl font-bold mt-2">📊 Historique des paris</h1>
          </div>
          <Link href="/paris/calculateur"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors">
            + Nouveau pari
          </Link>
        </div>

        {/* Stats résumé */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Paris', val: stats.total },
            { label: '✅ Gagnés', val: stats.gagnes, color: 'text-emerald-400' },
            { label: '❌ Perdus', val: stats.perdus, color: 'text-red-400' },
            { label: 'Réussite', val: `${stats.txReussite}%` },
            { label: 'ROI', val: `${stats.roi >= 0 ? '+' : ''}${stats.roi}%`, color: stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
              <p className={`text-xl font-bold ${s.color ?? 'text-white'}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* P&L cumulé */}
        {evolution.length > 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-emerald-400">📈 Évolution P&L</h2>
              <span className={`text-sm font-bold ${cumul >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {cumul >= 0 ? '+' : ''}{cumul.toFixed(2)}{bankroll.devise}
              </span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {evolution.map((val, i) => {
                const max = Math.max(...evolution.map(Math.abs), 1)
                const pct = Math.abs(val) / max
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end" title={`${val >= 0 ? '+' : ''}${val.toFixed(2)}${bankroll.devise}`}>
                    <div
                      className={`rounded-sm ${val >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ height: `${Math.max(pct * 100, 4)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1er pari</span>
              <span>Dernier pari ({evolution.length})</span>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['tous', 'en_cours', 'gagné', 'perdu', 'annulé'] as const).map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtre === f ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              {f === 'tous' ? `Tous (${paris.length})` :
               f === 'en_cours' ? `⏳ En cours (${paris.filter(p=>p.statut==='en_cours').length})` :
               f === 'gagné' ? `✅ Gagnés (${paris.filter(p=>p.statut==='gagné').length})` :
               f === 'perdu' ? `❌ Perdus (${paris.filter(p=>p.statut==='perdu').length})` :
               `🚫 Annulés (${paris.filter(p=>p.statut==='annulé').length})`}
            </button>
          ))}
        </div>

        {/* Liste paris */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg font-semibold mb-1">
              {paris.length === 0 ? 'Aucun pari enregistré' : 'Aucun pari dans cette catégorie'}
            </p>
            {paris.length === 0 && (
              <Link href="/paris/calculateur"
                className="mt-3 inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                Calculer ma première value bet
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(pari => (
              <div key={pari.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUT_COLORS[pari.statut]}`}>
                        {STATUT_LABELS[pari.statut]}
                      </span>
                      <span className="text-xs text-gray-600">{pari.typePari}</span>
                    </div>
                    <h3 className="font-bold text-base">{pari.selection}</h3>
                    <p className="text-sm text-gray-400">{pari.match}</p>
                    <p className="text-xs text-gray-600">{pari.competition} · {new Date(pari.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Cote</p>
                    <p className="text-2xl font-bold text-white">{pari.coteStake}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-800 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-500">Mise</p>
                    <p className="font-bold">{pari.mise}{bankroll.devise}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-500">Prob. estimée</p>
                    <p className="font-bold">{pari.probEstimee.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-500">Gain net</p>
                    <p className={`font-bold ${
                      pari.statut === 'gagné' ? 'text-emerald-400' :
                      pari.statut === 'perdu' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {pari.statut === 'gagné' ? `+${pari.gain}${bankroll.devise}` :
                       pari.statut === 'perdu' ? `-${pari.mise}${bankroll.devise}` :
                       pari.statut === 'annulé' ? '0' : '—'}
                    </p>
                  </div>
                </div>

                {pari.notes && (
                  <p className="text-xs text-gray-500 italic mb-3 border-l-2 border-gray-700 pl-2">{pari.notes}</p>
                )}

                {/* Actions */}
                {pari.statut === 'en_cours' && (
                  editId === pari.id ? (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleStatut(pari.id, 'gagné')}
                        className="flex-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold py-2 rounded-xl text-sm hover:bg-emerald-500/30 transition-colors">
                        ✅ Gagné
                      </button>
                      <button onClick={() => handleStatut(pari.id, 'perdu')}
                        className="flex-1 bg-red-500/20 border border-red-500/40 text-red-400 font-bold py-2 rounded-xl text-sm hover:bg-red-500/30 transition-colors">
                        ❌ Perdu
                      </button>
                      <button onClick={() => handleStatut(pari.id, 'annulé')}
                        className="flex-1 bg-gray-700 text-gray-400 font-bold py-2 rounded-xl text-sm hover:bg-gray-600 transition-colors">
                        🚫 Annulé
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="px-3 bg-gray-800 text-gray-500 rounded-xl text-sm hover:bg-gray-700 transition-colors">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditId(pari.id)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 rounded-xl text-sm transition-colors">
                        Mettre à jour le résultat
                      </button>
                      <button onClick={() => handleDelete(pari.id)}
                        className="px-4 bg-gray-800 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl text-sm transition-colors">
                        🗑
                      </button>
                    </div>
                  )
                )}

                {pari.statut !== 'en_cours' && (
                  <button onClick={() => handleDelete(pari.id)}
                    className="text-xs text-gray-700 hover:text-red-400 transition-colors">
                    Supprimer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
