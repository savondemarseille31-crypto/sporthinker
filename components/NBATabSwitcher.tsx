'use client'

import { useState } from 'react'
import type { ESPNPlayerAverage } from '@/lib/espn-api'

type Tab = 'pts' | 'reb' | 'ast' | 'blk' | 'stl'

const TABS: { key: Tab; label: string }[] = [
  { key: 'pts', label: 'Points' },
  { key: 'reb', label: 'Rebonds' },
  { key: 'ast', label: 'Passes' },
  { key: 'blk', label: 'Contres' },
  { key: 'stl', label: 'Interceptions' },
]

// Color helpers
function ptsColor(v: number) {
  if (v >= 25) return 'text-violet-400'
  if (v >= 20) return 'text-yellow-400'
  return 'text-white'
}
function rebColor(v: number) {
  if (v >= 10) return 'text-violet-400'
  if (v >= 7)  return 'text-yellow-400'
  return 'text-white'
}
function astColor(v: number) {
  if (v >= 7) return 'text-violet-400'
  if (v >= 5) return 'text-yellow-400'
  return 'text-white'
}
function blkColor(v: number) {
  if (v >= 2) return 'text-violet-400'
  return 'text-white'
}
function stlColor(v: number) {
  if (v >= 1.5) return 'text-violet-400'
  return 'text-white'
}

function fmt(v: number | null | undefined, decimals = 1): string {
  if (v == null) return '—'
  return v.toFixed(decimals)
}

function PlayerTable({ players, tab }: { players: ESPNPlayerAverage[]; tab: Tab }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-[#262b36]">
            <th className="text-left py-2 px-2 w-8">#</th>
            <th className="text-left py-2 px-2">Joueur</th>
            <th className="text-center py-2 px-2">Éq.</th>
            {tab === 'pts' && (
              <>
                <th className="text-center py-2 px-2 text-violet-400">PTS</th>
                <th className="text-center py-2 px-2">REB</th>
                <th className="text-center py-2 px-2">AST</th>
                <th className="text-center py-2 px-2 hidden sm:table-cell">FG%</th>
                <th className="text-center py-2 px-2 hidden sm:table-cell">3P%</th>
                <th className="text-center py-2 px-2">GP</th>
              </>
            )}
            {tab === 'reb' && (
              <>
                <th className="text-center py-2 px-2 text-violet-400">REB</th>
                <th className="text-center py-2 px-2">PTS</th>
                <th className="text-center py-2 px-2">AST</th>
                <th className="text-center py-2 px-2">GP</th>
              </>
            )}
            {tab === 'ast' && (
              <>
                <th className="text-center py-2 px-2 text-violet-400">AST</th>
                <th className="text-center py-2 px-2">PTS</th>
                <th className="text-center py-2 px-2">REB</th>
                <th className="text-center py-2 px-2">GP</th>
              </>
            )}
            {tab === 'blk' && (
              <>
                <th className="text-center py-2 px-2 text-violet-400">BLK</th>
                <th className="text-center py-2 px-2">PTS</th>
                <th className="text-center py-2 px-2">REB</th>
                <th className="text-center py-2 px-2">GP</th>
              </>
            )}
            {tab === 'stl' && (
              <>
                <th className="text-center py-2 px-2 text-violet-400">STL</th>
                <th className="text-center py-2 px-2">PTS</th>
                <th className="text-center py-2 px-2">AST</th>
                <th className="text-center py-2 px-2">GP</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr
              key={p.playerId}
              className="border-b border-[#262b36]/50 hover:bg-gray-800/30 transition-colors"
            >
              <td className="py-2.5 px-2 text-gray-600 text-xs">{i + 1}</td>
              <td className="py-2.5 px-2 font-medium text-white whitespace-nowrap">
                {p.displayName}
              </td>
              <td className="py-2.5 px-2 text-center">
                <span className="text-xs text-blue-300 font-semibold">{p.teamAbbr}</span>
              </td>
              {tab === 'pts' && (
                <>
                  <td className={`py-2.5 px-2 text-center font-bold ${ptsColor(p.pts)}`}>{fmt(p.pts)}</td>
                  <td className={`py-2.5 px-2 text-center ${rebColor(p.reb)}`}>{fmt(p.reb)}</td>
                  <td className={`py-2.5 px-2 text-center ${astColor(p.ast)}`}>{fmt(p.ast)}</td>
                  <td className="py-2.5 px-2 text-center text-gray-400 hidden sm:table-cell">{fmt(p.fgPct * 100)}%</td>
                  <td className="py-2.5 px-2 text-center text-gray-400 hidden sm:table-cell">{fmt(p.fg3Pct * 100)}%</td>
                  <td className="py-2.5 px-2 text-center text-gray-500 text-xs">{p.gamesPlayed}</td>
                </>
              )}
              {tab === 'reb' && (
                <>
                  <td className={`py-2.5 px-2 text-center font-bold ${rebColor(p.reb)}`}>{fmt(p.reb)}</td>
                  <td className={`py-2.5 px-2 text-center ${ptsColor(p.pts)}`}>{fmt(p.pts)}</td>
                  <td className={`py-2.5 px-2 text-center ${astColor(p.ast)}`}>{fmt(p.ast)}</td>
                  <td className="py-2.5 px-2 text-center text-gray-500 text-xs">{p.gamesPlayed}</td>
                </>
              )}
              {tab === 'ast' && (
                <>
                  <td className={`py-2.5 px-2 text-center font-bold ${astColor(p.ast)}`}>{fmt(p.ast)}</td>
                  <td className={`py-2.5 px-2 text-center ${ptsColor(p.pts)}`}>{fmt(p.pts)}</td>
                  <td className={`py-2.5 px-2 text-center ${rebColor(p.reb)}`}>{fmt(p.reb)}</td>
                  <td className="py-2.5 px-2 text-center text-gray-500 text-xs">{p.gamesPlayed}</td>
                </>
              )}
              {tab === 'blk' && (
                <>
                  <td className={`py-2.5 px-2 text-center font-bold ${blkColor(p.blk)}`}>{fmt(p.blk)}</td>
                  <td className={`py-2.5 px-2 text-center ${ptsColor(p.pts)}`}>{fmt(p.pts)}</td>
                  <td className={`py-2.5 px-2 text-center ${rebColor(p.reb)}`}>{fmt(p.reb)}</td>
                  <td className="py-2.5 px-2 text-center text-gray-500 text-xs">{p.gamesPlayed}</td>
                </>
              )}
              {tab === 'stl' && (
                <>
                  <td className={`py-2.5 px-2 text-center font-bold ${stlColor(p.stl)}`}>{fmt(p.stl)}</td>
                  <td className={`py-2.5 px-2 text-center ${ptsColor(p.pts)}`}>{fmt(p.pts)}</td>
                  <td className={`py-2.5 px-2 text-center ${astColor(p.ast)}`}>{fmt(p.ast)}</td>
                  <td className="py-2.5 px-2 text-center text-gray-500 text-xs">{p.gamesPlayed}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function NBATabSwitcher({ players }: { players: ESPNPlayerAverage[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('pts')

  // Sort players by the active stat
  const sorted = [...players].sort((a, b) => b[activeTab] - a[activeTab])

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-violet-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <section className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 mb-6">
        <h2 className="text-base font-bold text-violet-400 mb-4">
          {TABS.find(t => t.key === activeTab)?.label} — Top Playoffs
        </h2>
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-2xl mb-2">📊</p>
            <p>Aucune donnée disponible</p>
          </div>
        ) : (
          <PlayerTable players={sorted} tab={activeTab} />
        )}
      </section>
    </>
  )
}
