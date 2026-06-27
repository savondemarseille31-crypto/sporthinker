'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { ALL_CDM_PLAYERS } from '@/lib/cdm-players'

const POSTES = ['Tous', 'Attaquant', 'Ailier', 'Milieu offensif', 'Milieu', 'Défenseur']
const GROUPES = ['Tous', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function JoueursPage() {
  const [filtrePoste, setFiltrePoste] = useState('Tous')
  const [filtreGroupe, setFiltreGroupe] = useState('Tous')
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('note')

  const joueursFiltres = ALL_CDM_PLAYERS
    .filter(p => filtrePoste === 'Tous' || p.poste === filtrePoste)
    .filter(p => filtreGroupe === 'Tous' || p.groupe === filtreGroupe)
    .filter(p => p.nom.toLowerCase().includes(recherche.toLowerCase()) || p.pays.toLowerCase().includes(recherche.toLowerCase()))
    .sort((a, b) => {
      if (tri === 'note') return b.note - a.note
      if (tri === 'buts') return b.buts - a.buts
      if (tri === 'passes') return b.passes - a.passes
      if (tri === 'xG') return b.xG - a.xG
      return 0
    })

  const getFormeColor = (f: string) => {
    if (f === 'V') return 'bg-violet-500'
    if (f === 'N') return 'bg-gray-500'
    return 'bg-red-500'
  }

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">← Retour CdM 2026</Link>
          <h1 className="text-4xl font-bold mt-2 mb-1">👤 Joueurs clés CdM 2026</h1>
          <p className="text-gray-400">Profils, stats avancées et forme récente des stars du tournoi</p>
        </div>

        {/* Filtres */}
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 mb-8 space-y-4">
          <input
            type="text"
            placeholder="🔍 Rechercher un joueur ou un pays..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
          <div className="flex flex-wrap gap-2">
            {POSTES.map(p => (
              <button key={p} onClick={() => setFiltrePoste(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtrePoste === p ? 'bg-violet-500 text-black' : 'bg-gray-800 text-gray-400 hover:border-violet-500 border border-gray-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">Trier par :</span>
            {[['note', '⭐ Note'], ['buts', '⚽ Buts'], ['passes', '🎯 Passes'], ['xG', '📊 xG']].map(([val, label]) => (
              <button key={val} onClick={() => setTri(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tri === val ? 'bg-violet-500 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste joueurs */}
        <p className="text-gray-500 text-sm mb-4">{joueursFiltres.length} joueurs</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {joueursFiltres.map(player => (
            <Link key={player.id} href={`/cdm/joueurs/${player.id}`}
              className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 hover:border-violet-500 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{player.flag}</span>
                    <h3 className="font-bold text-lg">{player.nom}</h3>
                  </div>
                  <p className="text-gray-400 text-sm">{player.poste} · {player.club}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-violet-400">{player.note}</p>
                  <p className="text-xs text-gray-500">Note moy.</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: '⚽ Buts', val: player.buts },
                  { label: '🎯 Passes', val: player.passes },
                  { label: '📊 xG', val: player.xG },
                  { label: '🔑 xA', val: player.xA },
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-2 text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="font-bold text-white">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Forme */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Forme :</span>
                {player.forme.map((f, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full ${getFormeColor(f)} flex items-center justify-center text-xs font-bold text-white`}>
                    {f}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
