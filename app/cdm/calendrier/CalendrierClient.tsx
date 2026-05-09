'use client'
import { useState } from 'react'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'

const GROUPES = ['Tous', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function CalendrierClient({ fixtures }: { fixtures: any[] }) {
  const [filtreGroupe, setFiltreGroupe] = useState('Tous')

  const matchsFiltres = filtreGroupe === 'Tous'
    ? CDM_FIXTURES
    : CDM_FIXTURES.filter(m => m.groupe === filtreGroupe)

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        {GROUPES.map((g) => (
          <button
            key={g}
            onClick={() => setFiltreGroupe(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtreGroupe === g
                ? 'bg-emerald-500 text-black'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-emerald-500'
            }`}
          >
            {g === 'Tous' ? 'Tous' : `Gr. ${g}`}
          </button>
        ))}
      </div>

      <p className="text-gray-500 text-sm mb-4">{matchsFiltres.length} matchs</p>

      <div className="space-y-3">
        {matchsFiltres.map((match) => (
          <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                  Groupe {match.groupe}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {match.heure}
                </span>
              </div>
              <span className="text-xs text-gray-600">📍 {match.stade}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{match.flagD} {match.domicile}</span>
              <span className="text-emerald-400 font-bold px-4">VS</span>
              <span className="font-semibold text-lg">{match.exterieur} {match.flagE}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
