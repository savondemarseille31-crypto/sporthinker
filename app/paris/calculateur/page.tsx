'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  calcEV, calcKelly, calcMiseKelly, devig, devigPower, blendProb, wBlend,
  isValueBet, savePari, getBankroll, type Bankroll, type TypePari
} from '@/lib/paris-store'

type Mode = 'simple' | 'devig'
type DevigMethod = 'mult' | 'power'

function CalculateurInner() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>('simple')
  const [bankroll, setBankroll] = useState<Bankroll>({ montantInitial: 1000, montantActuel: 1000, devise: '€' })

  // Mode simple
  const [coteStake, setCoteStake] = useState('')
  const [probEstimee, setProbEstimee] = useState('')

  // Mode devig (3 cotes Pinnacle)
  const [cote1, setCote1] = useState('')
  const [coteN, setCoteN] = useState('')
  const [cote2, setCote2] = useState('')
  const [selectionDevig, setSelectionDevig] = useState<0 | 1 | 2>(0)
  const [devigMethod, setDevigMethod] = useState<DevigMethod>('mult')
  const [probModele, setProbModele] = useState('')
  const [typeBlend, setTypeBlend] = useState<TypePari>('1X2')

  // Formulaire ajout pari
  const [showForm, setShowForm] = useState(false)
  const [match, setMatch] = useState('')
  const [competition, setCompetition] = useState('CdM 2026')
  const [typePari, setTypePari] = useState<TypePari>('1X2')
  const [selection, setSelection] = useState('')
  const [mise, setMise] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getBankroll().then(setBankroll)
    const p = searchParams.get('p')
    if (p) setProbEstimee(p)
  }, [searchParams])

  // ---- Calculs ----
  const coteNum = parseFloat(coteStake)
  const probNum = parseFloat(probEstimee)

  // Devig Pinnacle
  let devigProbs: number[] = []
  let devigProb = 0
  if (mode === 'devig') {
    const c1 = parseFloat(cote1)
    const cn = parseFloat(coteN)
    const c2 = parseFloat(cote2)
    if (!isNaN(c1) && !isNaN(cn) && !isNaN(c2) && c1 > 1 && cn > 1 && c2 > 1) {
      devigProbs = devigMethod === 'power' ? devigPower([c1, cn, c2]) : devig([c1, cn, c2])
      devigProb = devigProbs[selectionDevig]
    }
  }

  // Blend marché : si l'utilisateur entre sa prob modèle, on shrink vers le marché
  const probModeleNum = parseFloat(probModele)
  const probBlended = mode === 'devig' && !isNaN(probModeleNum) && devigProb > 0
    ? blendProb(probModeleNum, devigProb, typeBlend)
    : null

  const probActive = mode === 'simple' ? probNum : (probBlended ?? devigProb)
  const coteActive = coteNum

  const ev = (!isNaN(coteActive) && !isNaN(probActive) && coteActive > 1 && probActive > 0)
    ? calcEV(coteActive, probActive) : null
  const kelly = ev !== null && ev > 0 ? calcKelly(coteActive, probActive) : 0
  const miseKelly = ev !== null && ev > 0 ? calcMiseKelly(bankroll.montantInitial, coteActive, probActive) : 0
  const isValue = ev !== null ? isValueBet(coteActive, probActive) : null

  const handleSave = async () => {
    if (!match || !selection || !mise || isNaN(parseFloat(mise))) return
    await savePari({
      match,
      competition,
      typePari,
      selection,
      coteStake: coteActive,
      probEstimee: probActive,
      mise: parseFloat(mise),
      statut: 'en_cours',
      notes,
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowForm(false) }, 2000)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-2xl mx-auto">
        <Link href="/paris" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour Paris</Link>
        <h1 className="text-3xl font-bold mt-2 mb-1">🎯 Calculateur ValueBet</h1>
        <p className="text-gray-400 text-sm mb-6">Calcule l'Expected Value et la mise optimale Kelly</p>

        {/* Mode selector */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('simple')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === 'simple' ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
            ✏️ Probabilité manuelle
          </button>
          <button onClick={() => setMode('devig')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === 'devig' ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
            📌 Devig Pinnacle
          </button>
        </div>

        {/* Inputs */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">

          {/* Cote Stake */}
          <div className="mb-5">
            <label className="text-sm text-gray-400 mb-2 block">Cote sur Stake.bet</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              placeholder="ex: 1.85"
              value={coteStake}
              onChange={e => setCoteStake(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {mode === 'simple' ? (
            <div className="mb-2">
              <label className="text-sm text-gray-400 mb-2 block">Ta probabilité estimée (%)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="99"
                placeholder="ex: 58"
                value={probEstimee}
                onChange={e => setProbEstimee(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-gray-600 mt-1">💡 Utilise les profils joueurs et stats de l'équipe pour estimer</p>
            </div>
          ) : (
            <div className="mb-2">
              <label className="text-sm text-gray-400 mb-3 block">
                Cotes Pinnacle — <span className="text-emerald-400">la marge sera retirée automatiquement</span>
              </label>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: '1 — Victoire dom.', val: cote1, set: setCote1 },
                  { label: 'X — Nul', val: coteN, set: setCoteN },
                  { label: '2 — Victoire ext.', val: cote2, set: setCote2 },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                    <input
                      type="number" step="0.01" min="1.01"
                      placeholder="ex: 1.72"
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                ))}
              </div>
                  {/* Méthode devig */}
              <div className="flex gap-2 mb-3">
                {(['mult', 'power'] as DevigMethod[]).map(m => (
                  <button key={m} onClick={() => setDevigMethod(m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${devigMethod === m ? 'bg-emerald-500/30 border border-emerald-500 text-emerald-400' : 'bg-gray-800 border border-gray-700 text-gray-400'}`}>
                    {m === 'mult' ? 'Multiplicatif' : 'Power (buteurs)'}
                  </button>
                ))}
              </div>

              {devigProbs.length === 3 && (
                <div className="bg-gray-800 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-2">Probabilités après devig ({devigMethod === 'power' ? 'méthode power' : 'multiplicatif'}) :</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['1 — Dom.', 'X — Nul', '2 — Ext.'].map((label, i) => (
                      <button key={i} onClick={() => setSelectionDevig(i as 0 | 1 | 2)}
                        className={`rounded-lg p-2 text-center transition-colors ${selectionDevig === i ? 'bg-emerald-500/30 border border-emerald-500' : 'border border-gray-700 hover:border-gray-500'}`}>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="font-bold text-white text-sm">{devigProbs[i]}%</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">← Clique sur ta sélection</p>

                  {/* Blend marché */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">🔀 Blend marché (optionnel)</p>
                    <div className="flex gap-2 items-center mb-2">
                      <input
                        type="number" step="0.5" min="1" max="99"
                        placeholder="Prob. modèle %"
                        value={probModele}
                        onChange={e => setProbModele(e.target.value)}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <select value={typeBlend} onChange={e => setTypeBlend(e.target.value as TypePari)}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-xs focus:outline-none">
                        <option value="1X2">1X2 (w=20%)</option>
                        <option value="over_under">O/U (w=30%)</option>
                        <option value="buteur">Buteur (w=55%)</option>
                        <option value="autre">Autre (w=40%)</option>
                      </select>
                    </div>
                    {probBlended !== null && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-400">Prob. blendée <span className="text-gray-500">({Math.round(wBlend(typeBlend)*100)}% modèle · {Math.round((1-wBlend(typeBlend))*100)}% marché)</span></p>
                        <p className="text-lg font-bold text-emerald-400">{probBlended}%</p>
                        <p className="text-xs text-gray-500">vs marché seul : {devigProb.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-600">
                💡 Pinnacle n'est pas encore connecté. Entre les cotes manuellement depuis
                <a href="https://www.pinnacle.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline ml-1">pinnacle.com</a>
              </p>
            </div>
          )}
        </div>

        {/* Résultat */}
        {ev !== null && (
          <div className={`rounded-2xl p-6 mb-4 border ${isValue ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{isValue ? '✅' : '❌'}</span>
              <h2 className={`text-xl font-bold ${isValue ? 'text-emerald-400' : 'text-red-400'}`}>
                {isValue ? 'Value Bet détectée !' : 'Pas de value'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-900/60 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Expected Value</p>
                <p className={`text-3xl font-bold ${isValue ? 'text-emerald-400' : 'text-red-400'}`}>
                  {ev > 0 ? '+' : ''}{(ev * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-900/60 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Probabilité</p>
                <p className="text-3xl font-bold text-white">
                  {probActive.toFixed(1)}%
                </p>
              </div>
            </div>

            {isValue && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900/60 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Kelly (¼)</p>
                  <p className="text-2xl font-bold text-white">{(kelly * 25).toFixed(2)}%</p>
                  <p className="text-xs text-gray-500">de ta bankroll</p>
                </div>
                <div className="bg-gray-900/60 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Mise recommandée</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {miseKelly}{bankroll.devise}
                  </p>
                  <p className="text-xs text-gray-500">sur {bankroll.montantInitial}{bankroll.devise}</p>
                </div>
              </div>
            )}

            <div className={`text-sm p-3 rounded-xl ${isValue ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
              {isValue
                ? `Pour chaque ${bankroll.devise}100 misés sur le long terme, tu gagnes en moyenne ${(ev * 100).toFixed(1)}${bankroll.devise} de profit.`
                : `Cette cote ne couvre pas le risque réel. La vraie valeur de ce pari est de ${((1/probActive)*100).toFixed(2)} — en dessous de la cote proposée.`
              }
            </div>
          </div>
        )}

        {/* Bouton enregistrer pari */}
        {isValue && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-colors mb-4">
            📝 Enregistrer ce pari
          </button>
        )}

        {/* Formulaire enregistrement */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
            <h3 className="font-bold text-emerald-400 mb-4">📝 Enregistrer le pari</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Match *</label>
                  <input value={match} onChange={e => setMatch(e.target.value)}
                    placeholder="ex: France vs Maroc"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Compétition</label>
                  <input value={competition} onChange={e => setCompetition(e.target.value)}
                    placeholder="ex: CdM 2026"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Type de pari</label>
                  <select value={typePari} onChange={e => setTypePari(e.target.value as TypePari)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
                    <option value="1X2">1X2</option>
                    <option value="buteur">Buteur</option>
                    <option value="over_under">Over/Under</option>
                    <option value="double_chance">Double Chance</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mise ({bankroll.devise}) *</label>
                  <input type="number" value={mise} onChange={e => setMise(e.target.value)}
                    placeholder={`Suggéré: ${miseKelly}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ta sélection *</label>
                <input value={selection} onChange={e => setSelection(e.target.value)}
                  placeholder="ex: France gagne, Mbappé buteur..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notes (optionnel)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Analyse, contexte..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 text-gray-400 font-medium py-2.5 rounded-xl transition-colors hover:bg-gray-700">
                  Annuler
                </button>
                <button onClick={handleSave}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl transition-colors">
                  {saved ? '✅ Enregistré !' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Explication */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400 space-y-2">
          <p className="font-semibold text-white">📖 Comment ça marche ?</p>
          <p>• <strong className="text-white">EV positif</strong> = la cote proposée est supérieure à la vraie probabilité → value bet</p>
          <p>• <strong className="text-white">Kelly ¼</strong> = fraction de Kelly divisée par 4 pour limiter le risque</p>
          <p>• <strong className="text-white">Mode Devig</strong> = entre les cotes Pinnacle pour calculer la vraie probabilité automatiquement</p>
          <p className="text-gray-600 text-xs pt-1">🔜 Connexion Pinnacle automatique via The Odds API — avant le 11 juin</p>
        </div>
      </div>
    </main>
  )
}

export default function CalculateurPage() {
  return (
    <Suspense>
      <CalculateurInner />
    </Suspense>
  )
}
