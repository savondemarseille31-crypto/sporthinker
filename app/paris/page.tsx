'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { getParis, getBankroll, calcStats, updatePari, type Pari, type Bankroll, saveBankroll } from '@/lib/paris-store'

// Sanitise une saisie de montant : uniquement chiffres + virgule (max 2 décimales).
// Stocké comme NOMBRE → aucune chaîne arbitraire ne peut être injectée.
function sanitizeMise(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, '').replace(/\./g, ',')
  const i = s.indexOf(',')
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, '').slice(0, 2)
  return s
}
function miseToNumber(s: string): number {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? parseFloat(n.toFixed(2)) : 0
}

function MiseInput({ pari, devise, onCommit }: { pari: Pari; devise: string; onCommit: () => void }) {
  const [val, setVal] = useState(pari.mise ? String(pari.mise).replace('.', ',') : '')
  async function commit() {
    await updatePari(pari.id, { mise: miseToNumber(val) })
    onCommit()
  }
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        value={val}
        onChange={e => setVal(sanitizeMise(e.target.value))}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        placeholder="0"
        maxLength={12}
        aria-label="Montant misé"
        className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm text-right text-white focus:outline-none focus:border-emerald-500"
      />
      <span className="text-sm text-gray-400">{devise}</span>
    </div>
  )
}

function CoteInput({ pari, onCommit }: { pari: Pari; onCommit: () => void }) {
  const [val, setVal] = useState(String(pari.coteStake).replace('.', ','))
  async function commit() {
    const n = parseFloat(val.replace(',', '.'))
    const valid = Number.isFinite(n) && n >= 1.01 // une cote décimale est toujours > 1
    if (valid) await updatePari(pari.id, { coteStake: parseFloat(n.toFixed(2)) })
    // re-formate l'affichage (revert si saisie invalide)
    setVal(String(valid ? parseFloat(n.toFixed(2)) : pari.coteStake).replace('.', ','))
    if (valid) onCommit()
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      value={val}
      onChange={e => setVal(sanitizeMise(e.target.value))}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      maxLength={7}
      aria-label="Cote réelle"
      className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm text-right text-white focus:outline-none focus:border-emerald-500"
    />
  )
}

export default function ParisPage() {
  const [paris, setParis] = useState<Pari[]>([])
  const [bankroll, setBankroll] = useState<Bankroll>({ montantInitial: 1000, montantActuel: 1000, devise: '€' })
  const [editBankroll, setEditBankroll] = useState(false)
  const [inputBankroll, setInputBankroll] = useState('')

  useEffect(() => {
    getParis().then(setParis)
    getBankroll().then(setBankroll)
  }, [])

  const refresh = () => { getParis().then(setParis) }

  const stats = calcStats(paris)
  const roiColor = stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'
  const gainColor = stats.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'

  const handleSaveBankroll = async () => {
    const val = parseFloat(inputBankroll)
    if (isNaN(val) || val <= 0) return
    const updated = { ...bankroll, montantInitial: val, montantActuel: val }
    await saveBankroll(updated)
    setBankroll(updated)
    setEditBankroll(false)
  }

  const derniersParis = paris.slice(0, 5)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">💰 Mes Paris</h1>
          <p className="text-gray-400">Calculateur ValueBet · Suivi bankroll · ROI en temps réel</p>
        </div>

        {/* Bankroll */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-emerald-400">💼 Bankroll</h2>
            <button onClick={() => { setEditBankroll(!editBankroll); setInputBankroll(String(bankroll.montantInitial)) }}
              className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
              {editBankroll ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {editBankroll ? (
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={inputBankroll}
                onChange={e => setInputBankroll(e.target.value)}
                placeholder="Ex: 1000"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              />
              <select
                value={bankroll.devise}
                onChange={e => setBankroll({ ...bankroll, devise: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none">
                <option>€</option><option>$</option><option>U</option>
              </select>
              <button onClick={handleSaveBankroll}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 rounded-xl transition-colors">
                Sauvegarder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Bankroll initiale</p>
                <p className="text-2xl font-bold text-white">{bankroll.montantInitial}{bankroll.devise}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Bankroll actuelle</p>
                <p className={`text-2xl font-bold ${(bankroll.montantActuel + stats.totalGain) >= bankroll.montantInitial ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(bankroll.montantActuel + stats.totalGain).toFixed(2)}{bankroll.devise}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">P&L total</p>
                <p className={`text-2xl font-bold ${gainColor}`}>
                  {stats.totalGain >= 0 ? '+' : ''}{stats.totalGain.toFixed(2)}{bankroll.devise}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">ROI</p>
                <p className={`text-2xl font-bold ${roiColor}`}>
                  {stats.roi >= 0 ? '+' : ''}{stats.roi}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '📋 Paris total', val: stats.total, sub: `${stats.enCours} en cours` },
            { label: '✅ Gagnés', val: stats.gagnes, sub: `${stats.txReussite}% réussite`, color: 'text-emerald-400' },
            { label: '❌ Perdus', val: stats.perdus, sub: `${stats.termines} terminés`, color: 'text-red-400' },
            { label: '📊 Cote moyenne', val: stats.coteMoyenne || '—', sub: 'sur paris terminés' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold mb-1 ${s.color ?? 'text-white'}`}>{s.val}</p>
              <p className="text-xs text-gray-500">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Raccourcis actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/paris/calculateur"
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500 transition-colors">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-lg text-emerald-400 mb-1">Calculateur ValueBet</h3>
            <p className="text-gray-400 text-sm">Entre ta cote Stake + probabilité → EV, Kelly, mise optimale</p>
            <div className="mt-4 text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg inline-block">
              Ouvrir le calculateur →
            </div>
          </Link>
          <Link href="/paris/historique"
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500 transition-colors">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-lg mb-1">Historique des paris</h3>
            <p className="text-gray-400 text-sm">Ajoute un pari, suis tes résultats et ton évolution bankroll</p>
            <div className="mt-4 text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg inline-block">
              {stats.total > 0 ? `${stats.total} paris enregistrés →` : 'Ajouter mon premier pari →'}
            </div>
          </Link>
        </div>

        {/* Derniers paris */}
        {derniersParis.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-emerald-400">🕐 Derniers paris</h2>
              <Link href="/paris/historique" className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {derniersParis.map(pari => (
                <div key={pari.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm">{pari.selection}</p>
                    <p className="text-xs text-gray-400">{pari.match}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {pari.statut === 'en_cours' ? (
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-gray-400">Cote <CoteInput pari={pari} onCommit={refresh} /></span>
                        <MiseInput pari={pari} devise={bankroll.devise} onCommit={refresh} />
                      </div>
                    ) : (
                      <p className="text-sm font-bold">Cote {pari.coteStake} · {pari.mise}{bankroll.devise}</p>
                    )}
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      pari.statut === 'gagné' ? 'bg-emerald-500/20 text-emerald-400' :
                      pari.statut === 'perdu' ? 'bg-red-500/20 text-red-400' :
                      pari.statut === 'annulé' ? 'bg-gray-700 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {pari.statut === 'gagné' ? `+${pari.gain}${bankroll.devise}` :
                       pari.statut === 'perdu' ? `-${pari.mise}${bankroll.devise}` :
                       pari.statut === 'annulé' ? 'Annulé' : 'En cours'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paris.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-lg font-semibold mb-1">Aucun pari enregistré</p>
            <p className="text-sm mb-4">Commence par calculer ta première value bet</p>
            <Link href="/paris/calculateur"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              Ouvrir le calculateur
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
