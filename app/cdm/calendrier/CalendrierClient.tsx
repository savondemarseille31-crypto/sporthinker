'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'

const GROUPES = ['Tous', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function CalendrierClient({ fixtures }: { fixtures: any[] }) {
  const [filtreGroupe, setFiltreGroupe] = useState('Tous')

  const matchsFiltres = (filtreGroupe === 'Tous'
    ? CDM_FIXTURES
    : CDM_FIXTURES.filter(m => m.groupe === filtreGroupe)
  ).slice().sort((a, b) => {
    const da = new Date(`${a.date}T${a.heure}:00`)
    const db = new Date(`${b.date}T${b.heure}:00`)
    return da.getTime() - db.getTime()
  })

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        {GROUPES.map((g) => (
          <button
            key={g}
            onClick={() => setFiltreGroupe(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtreGroupe === g
                ? 'bg-violet-500 text-black'
                : 'bg-[#14171f] border border-[#262b36] text-gray-400 hover:border-violet-500'
            }`}
          >
            {g === 'Tous' ? 'Tous' : `Gr. ${g}`}
          </button>
        ))}
      </div>

      <p className="text-gray-500 text-sm mb-4">{matchsFiltres.length} matchs</p>

      <div className="space-y-2">
        {matchsFiltres.map((match) => (
          <Link key={match.id} href={`/cdm/matchup/${match.id}`} className="block bg-[#14171f] border border-[#262b36] rounded-xl px-5 py-4 hover:border-violet-500 transition-colors group">
            {/* Ligne meta */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                Gr. {match.groupe}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {new Date(`${match.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-violet-400 font-medium">{match.heure}</span>
              <span className="text-xs text-gray-700 ml-auto truncate hidden sm:block">📍 {match.stade}</span>
            </div>

            {/* Équipes — 3 colonnes avec centrage parfait */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl shrink-0">{match.flagD}</span>
                <span className="font-semibold text-white group-hover:text-violet-400 transition-colors truncate">{match.domicile}</span>
              </div>
              <span className="text-violet-400 font-bold text-sm w-8 text-center shrink-0">VS</span>
              <div className="flex items-center gap-2 justify-end">
                <span className="font-semibold text-white group-hover:text-violet-400 transition-colors truncate">{match.exterieur}</span>
                <span className="text-xl shrink-0">{match.flagE}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
