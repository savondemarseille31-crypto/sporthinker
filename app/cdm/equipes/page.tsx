'use client'
import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { CDM_GROUPS } from '@/lib/cdm-groups'
import { CDM_TEAM_PROFILES, pays2slug } from '@/lib/cdm-teams'
import { ALL_CDM_PLAYERS } from '@/lib/cdm-players'

export default function EquipesPage() {
  const [recherche, setRecherche] = useState('')
  const [filtreGroupe, setFiltreGroupe] = useState('Tous')

  const groupes = ['Tous', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  const getTeamProfile = (pays: string) => CDM_TEAM_PROFILES.find(t => t.pays === pays)
  const getTeamFlag = (pays: string) => {
    const profile = getTeamProfile(pays)
    if (profile) return profile.flag
    const player = ALL_CDM_PLAYERS.find(p => p.pays === pays)
    return player?.flag ?? '🏳️'
  }
  const getTopPlayer = (pays: string) => {
    const players = ALL_CDM_PLAYERS.filter(p => p.pays === pays)
    return players.sort((a, b) => b.note - a.note)[0]
  }

  const allTeams = Object.entries(CDM_GROUPS).flatMap(([groupe, data]) =>
    data.teams.map(pays => ({ pays, groupe }))
  ).filter((t, i, arr) => arr.findIndex(x => x.pays === t.pays) === i) // dedup Mexico

  const filtered = allTeams
    .filter(t => filtreGroupe === 'Tous' || t.groupe === filtreGroupe)
    .filter(t => t.pays.toLowerCase().includes(recherche.toLowerCase()))

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <nav className="flex gap-6 text-sm text-gray-400">
          <Link href="/cdm" className="text-emerald-400 font-semibold">🌍 CdM 2026</Link>
          <Link href="/nba" className="hover:text-emerald-400 transition-colors">🏀 NBA</Link>
          <Link href="/paris" className="hover:text-emerald-400 transition-colors">💰 Mes Paris</Link>
        </nav>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour CdM 2026</Link>
          <h1 className="text-4xl font-bold mt-2 mb-1">🌍 Les 48 équipes</h1>
          <p className="text-gray-400">Profils, forces, faiblesses et joueurs clés de chaque nation</p>
        </div>

        {/* Filtres */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-8 space-y-4">
          <input
            type="text"
            placeholder="🔍 Rechercher une équipe..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex flex-wrap gap-2">
            {groupes.map(g => (
              <button key={g} onClick={() => setFiltreGroupe(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtreGroupe === g ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-400 hover:border-emerald-500 border border-gray-700'}`}>
                {g === 'Tous' ? 'Tous les groupes' : `Groupe ${g}`}
              </button>
            ))}
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-4">{filtered.length} équipes</p>

        {/* Groupes */}
        {filtreGroupe === 'Tous' ? (
          Object.entries(CDM_GROUPS).map(([groupe, data]) => {
            const teams = data.teams.filter(pays =>
              pays.toLowerCase().includes(recherche.toLowerCase())
            )
            if (teams.length === 0) return null
            return (
              <div key={groupe} className="mb-8">
                <h2 className="text-lg font-bold text-emerald-400 mb-3">Groupe {groupe}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.teams.map(pays => {
                    const profile = getTeamProfile(pays)
                    const topPlayer = getTopPlayer(pays)
                    const slug = pays2slug(pays)
                    return (
                      <Link key={pays} href={`/cdm/equipes/${slug}`}
                        className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{getTeamFlag(pays)}</span>
                          <div>
                            <h3 className="font-bold text-sm leading-tight">{pays}</h3>
                            {data.host === pays && (
                              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Pays hôte</span>
                            )}
                          </div>
                        </div>
                        {profile && (
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Classement FIFA</span>
                              <span className="text-xs font-bold text-emerald-400">#{profile.classementFIFA}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Formation</span>
                              <span className="text-xs text-white">{profile.formation}</span>
                            </div>
                          </div>
                        )}
                        {topPlayer && (
                          <div className="border-t border-gray-800 pt-2 mt-2">
                            <p className="text-xs text-gray-500">Star</p>
                            <p className="text-xs font-semibold text-white truncate">{topPlayer.nom}</p>
                            <p className="text-xs text-emerald-400">{topPlayer.note}/10</p>
                          </div>
                        )}
                        {!topPlayer && (
                          <div className="border-t border-gray-800 pt-2 mt-2">
                            <p className="text-xs text-gray-500">Profil disponible →</p>
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map(({ pays }) => {
              const profile = getTeamProfile(pays)
              const topPlayer = getTopPlayer(pays)
              const slug = pays2slug(pays)
              return (
                <Link key={pays} href={`/cdm/equipes/${slug}`}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{getTeamFlag(pays)}</span>
                    <div>
                      <h3 className="font-bold">{pays}</h3>
                      <p className="text-xs text-gray-500">Groupe {filtreGroupe}</p>
                    </div>
                  </div>
                  {profile && (
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Classement FIFA</span>
                        <span className="text-xs font-bold text-emerald-400">#{profile.classementFIFA}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Sélectionneur</span>
                        <span className="text-xs text-white text-right">{profile.selectionneur}</span>
                      </div>
                    </div>
                  )}
                  {topPlayer && (
                    <div className="border-t border-gray-800 pt-2 mt-2">
                      <p className="text-xs text-gray-500">Star · <span className="text-white font-semibold">{topPlayer.nom}</span></p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
