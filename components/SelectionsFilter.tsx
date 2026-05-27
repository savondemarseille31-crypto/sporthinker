'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Sport = 'tout' | 'atp' | 'wta'

const TABS: { key: Sport; label: string }[] = [
  { key: 'tout', label: '🌐 Tout' },
  { key: 'atp',  label: '🎾 ATP'  },
  { key: 'wta',  label: '🎾 WTA'  },
]

export default function SelectionsFilter({
  counts,
  current,
}: {
  counts: Record<Sport, number>
  current: Sport
}) {
  const router   = useRouter()
  const pathname = usePathname()

  function go(sport: Sport) {
    const params = new URLSearchParams()
    if (sport !== 'tout') params.set('sport', sport)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map(tab => {
        const active = tab.key === current
        const count  = counts[tab.key]
        return (
          <button
            key={tab.key}
            onClick={() => go(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              active
                ? 'bg-emerald-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-black/20 text-black' : 'bg-gray-700 text-gray-400'}`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
