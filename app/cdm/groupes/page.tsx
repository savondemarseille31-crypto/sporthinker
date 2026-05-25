'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { CDM_GROUPS } from '@/lib/cdm-groups'

const DRAPEAUX: Record<string, string> = {
  // Groupe A
  'Mexico': '🇲🇽', 'South Korea': '🇰🇷', 'South Africa': '🇿🇦', 'Czechia': '🇨🇿',
  // Groupe B
  'Canada': '🇨🇦', 'Switzerland': '🇨🇭', 'Qatar': '🇶🇦', 'Bosnia-Herzegovina': '🇧🇦',
  // Groupe C
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haiti': '🇭🇹',
  // Groupe D
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  // Groupe E
  'Germany': '🇩🇪', 'Ecuador': '🇪🇨', 'Ivory Coast': '🇨🇮', 'Curaçao': '🇨🇼',
  // Groupe F
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Tunisia': '🇹🇳', 'Sweden': '🇸🇪',
  // Groupe G
  'Belgium': '🇧🇪', 'Iran': '🇮🇷', 'Egypt': '🇪🇬', 'New Zealand': '🇳🇿',
  // Groupe H
  'Spain': '🇪🇸', 'Uruguay': '🇺🇾', 'Saudi Arabia': '🇸🇦', 'Cape Verde': '🇨🇻',
  // Groupe I
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Norway': '🇳🇴', 'Iraq': '🇮🇶',
  // Groupe J
  'Argentina': '🇦🇷', 'Austria': '🇦🇹', 'Algeria': '🇩🇿', 'Jordan': '🇯🇴',
  // Groupe K
  'Portugal': '🇵🇹', 'Colombia': '🇨🇴', 'Uzbekistan': '🇺🇿', 'DR Congo': '🇨🇩',
  // Groupe L
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Panama': '🇵🇦', 'Ghana': '🇬🇭',
}

export default function GroupesPage() {
  const [activeGroup, setActiveGroup] = useState('A')
  const groupKeys = Object.keys(CDM_GROUPS)
  const currentGroup = CDM_GROUPS[activeGroup as keyof typeof CDM_GROUPS]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour CdM 2026</Link>
          <h1 className="text-4xl font-bold mt-2 mb-1">Groupes CdM 2026</h1>
          <p className="text-gray-400">12 groupes · 48 équipes · USA, Canada, Mexique</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {groupKeys.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeGroup === g
                  ? 'bg-emerald-500 text-black'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:border-emerald-500 hover:text-white'
              }`}
            >
              Groupe {g}
            </button>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-emerald-400 mb-6">Groupe {activeGroup}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentGroup.teams.map((team, index) => (
              <div key={team} className="flex items-center gap-4 bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors">
                <span className="text-3xl w-10 text-center">{index + 1}</span>
                <span className="text-4xl">{DRAPEAUX[team] || '🏳️'}</span>
                <div>
                  <p className="font-semibold text-lg">{team}</p>
                  {currentGroup.host === team && (
                    <span className="text-xs text-emerald-400 font-medium">🏟️ Pays hôte</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 text-gray-300">Vue d'ensemble</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {groupKeys.map((g) => (
              <button key={g} onClick={() => setActiveGroup(g)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-emerald-500 transition-colors">
                <p className="text-emerald-400 font-bold mb-2">Groupe {g}</p>
                {CDM_GROUPS[g as keyof typeof CDM_GROUPS].teams.map((t) => (
                  <p key={t} className="text-sm text-gray-400 flex items-center gap-1">
                    <span>{DRAPEAUX[t] || '🏳️'}</span> {t}
                  </p>
                ))}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
