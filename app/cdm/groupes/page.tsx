'use client'
import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { CDM_GROUPS } from '@/lib/cdm-groups'

const DRAPEAUX: Record<string, string> = {
  'Mexico': '🇲🇽', 'Ecuador': '🇪🇨', 'Jamaica': '🇯🇲', 'Venezuela': '🇻🇪',
  'USA': '🇺🇸', 'Panama': '🇵🇦', 'Bolivia': '🇧🇴', 'New Zealand': '🇳🇿',
  'Canada': '🇨🇦', 'Honduras': '🇭🇳', 'Chile': '🇨🇱', 'Australia': '🇦🇺',
  'France': '🇫🇷', 'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Uzbekistan': '🇺🇿',
  'Germany': '🇩🇪', 'Colombia': '🇨🇴', 'Uruguay': '🇺🇾', 'Japan': '🇯🇵',
  'Portugal': '🇵🇹', 'Argentina': '🇦🇷', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷',
  'Spain': '🇪🇸', 'Brazil': '🇧🇷', 'Nigeria': '🇳🇬', 'Saudi Arabia': '🇸🇦',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Netherlands': '🇳🇱', 'DR Congo': '🇨🇩', 'Qatar': '🇶🇦',
  'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'Peru': '🇵🇪', 'Costa Rica': '🇨🇷',
  'Croatia': '🇭🇷', 'Cameroon': '🇨🇲', 'Iran': '🇮🇷',
  'Italy': '🇮🇹', 'Tunisia': '🇹🇳', 'Cuba': '🇨🇺', 'Indonesia': '🇮🇩',
  'Switzerland': '🇨🇭', 'Serbia': '🇷🇸', 'Algeria': '🇩🇿', 'Paraguay': '🇵🇾',
}

export default function GroupesPage() {
  const [activeGroup, setActiveGroup] = useState('A')
  const groupKeys = Object.keys(CDM_GROUPS)
  const currentGroup = CDM_GROUPS[activeGroup as keyof typeof CDM_GROUPS]

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
