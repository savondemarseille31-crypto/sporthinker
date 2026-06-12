'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type Sport = 'tous' | 'mlb' | 'cdm' | 'nba' | 'tennis' | 'mls' | 'values'

export default function SignauxFilter({
  counts,
  mlb, cdm, nba, tennis, mls, values,
}: {
  counts: { mlb: number; cdm: number; nba: number; tennis: number; mls: number; values: number }
  mlb:    React.ReactNode
  cdm:    React.ReactNode
  nba:    React.ReactNode
  tennis: React.ReactNode
  mls:    React.ReactNode
  values: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Sport | null) ?? 'tous'
  const [active, setActive] = useState<Sport>(initialTab)

  useEffect(() => {
    const tab = searchParams.get('tab') as Sport | null
    if (tab) setActive(tab)
  }, [searchParams])
  const total = counts.mlb + counts.cdm + counts.nba + counts.tennis + counts.mls

  const tabs: { key: Sport; emoji: string; label: string; count: number; highlight?: boolean }[] = [
    { key: 'tous',   emoji: '⚡', label: 'Tous',    count: total           },
    { key: 'values', emoji: '💰', label: 'Values',  count: counts.values, highlight: true },
    { key: 'tennis', emoji: '🎾', label: 'Tennis',  count: counts.tennis   },
    { key: 'mlb',    emoji: '⚾', label: 'MLB',     count: counts.mlb      },
    { key: 'mls',    emoji: '⚽', label: 'MLS',     count: counts.mls      },
    { key: 'cdm',    emoji: '🌍', label: 'CdM',     count: counts.cdm      },
    { key: 'nba',    emoji: '🏀', label: 'NBA',     count: counts.nba      },
  ]

  const show = (sport: Sport) => {
    if (active === 'values') return sport === 'values'
    if (active === 'tous') return sport !== 'values'
    return active === sport
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-2 scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
              active === t.key
                ? t.highlight ? 'bg-yellow-500 text-black' : 'bg-emerald-500 text-black'
                : t.highlight
                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-800 border border-yellow-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                active === t.key ? 'bg-black/20 text-black' : 'bg-gray-700 text-gray-300'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {(
        [
          { key: 'values', content: values },
          { key: 'tennis', content: tennis },
          { key: 'mlb',    content: mlb    },
          { key: 'mls',    content: mls    },
          { key: 'cdm',    content: cdm    },
          { key: 'nba',    content: nba    },
        ] as { key: Sport; content: React.ReactNode }[]
      ).map(({ key, content }) =>
        show(key) ? <div key={key}>{content}</div> : null
      )}
    </>
  )
}
