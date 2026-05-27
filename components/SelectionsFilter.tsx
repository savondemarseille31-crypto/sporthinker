'use client'
import { useState } from 'react'
import SelectionsTracker from './SelectionsTracker'
import type { TrackedBet, LevelStats } from '@/lib/selections-db'

type Tab = 'tous' | 'tennis' | 'mlb' | 'nba' | 'suivi'

export default function SelectionsFilter({
  counts,
  tennis,
  mlb,
  nba,
  trackedBets,
  trackedStats,
}: {
  counts: { tennis: number; mlb: number; nba: number }
  tennis: React.ReactNode
  mlb:    React.ReactNode
  nba:    React.ReactNode
  trackedBets: TrackedBet[]
  trackedStats: Record<string, LevelStats>
}) {
  const [active, setActive] = useState<Tab>('tous')
  const total = counts.tennis + counts.mlb + counts.nba

  const tabs: { key: Tab; emoji: string; label: string; count?: number }[] = [
    { key: 'tous',   emoji: '⚡', label: 'Tous',   count: total         },
    { key: 'tennis', emoji: '🎾', label: 'Tennis', count: counts.tennis },
    { key: 'mlb',    emoji: '⚾', label: 'MLB',    count: counts.mlb    },
    { key: 'nba',    emoji: '🏀', label: 'NBA',    count: counts.nba    },
    { key: 'suivi',  emoji: '📊', label: 'Suivi'                        },
  ]

  const show = (sport: Tab) => active === 'tous' || active === sport

  return (
    <>
      <div className="flex gap-2 overflow-x-auto mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-2 scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
              active === t.key
                ? 'bg-emerald-500 text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                active === t.key ? 'bg-black/20 text-black' : 'bg-gray-700 text-gray-300'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {active === 'suivi' ? (
        <SelectionsTracker bets={trackedBets} stats={trackedStats} />
      ) : (
        <>
          {show('tennis') && <div key="tennis">{tennis}</div>}
          {show('mlb')    && <div key="mlb">{mlb}</div>}
          {show('nba')    && <div key="nba">{nba}</div>}
        </>
      )}
    </>
  )
}
