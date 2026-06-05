'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CDM_GROUPS } from '@/lib/cdm-groups'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import type { GroupStandingData, TeamStanding } from '@/lib/cdm-standings'

const DRAPEAUX: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Korea': '🇰🇷', 'South Africa': '🇿🇦', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Switzerland': '🇨🇭', 'Qatar': '🇶🇦', 'Bosnia-Herzegovina': '🇧🇦',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Haiti': '🇭🇹',
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  'Germany': '🇩🇪', 'Ecuador': '🇪🇨', 'Ivory Coast': '🇨🇮', 'Curaçao': '🇨🇼',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Tunisia': '🇹🇳', 'Sweden': '🇸🇪',
  'Belgium': '🇧🇪', 'Iran': '🇮🇷', 'Egypt': '🇪🇬', 'New Zealand': '🇳🇿',
  'Spain': '🇪🇸', 'Uruguay': '🇺🇾', 'Saudi Arabia': '🇸🇦', 'Cape Verde': '🇨🇻',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Norway': '🇳🇴', 'Iraq': '🇮🇶',
  'Argentina': '🇦🇷', 'Austria': '🇦🇹', 'Algeria': '🇩🇿', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Colombia': '🇨🇴', 'Uzbekistan': '🇺🇿', 'DR Congo': '🇨🇩',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Panama': '🇵🇦', 'Ghana': '🇬🇭',
}

function FormDots({ form }: { form: string }) {
  if (!form) return null
  return (
    <div className="flex gap-0.5">
      {form.split('').slice(-3).map((r, i) => (
        <span
          key={i}
          className={`inline-block w-2 h-2 rounded-full ${
            r === 'W' ? 'bg-emerald-400' : r === 'D' ? 'bg-yellow-400' : r === 'L' ? 'bg-red-400' : 'bg-gray-600'
          }`}
        />
      ))}
    </div>
  )
}

function StandingsTable({ standings, live }: { standings: TeamStanding[]; live: boolean }) {
  return (
    <div>
      {/* En-tête */}
      <div className="grid grid-cols-[28px_1fr_36px_28px_28px_28px_28px_36px] gap-x-1 px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-800">
        <span className="text-center">#</span>
        <span>Équipe</span>
        <span className="text-center font-bold text-gray-400">Pts</span>
        <span className="text-center">J</span>
        <span className="text-center">G</span>
        <span className="text-center">N</span>
        <span className="text-center">P</span>
        <span className="text-center">Diff</span>
      </div>

      {standings.map((t, idx) => {
        const qualified = idx < 2
        return (
          <div
            key={t.team}
            className={`grid grid-cols-[28px_1fr_36px_28px_28px_28px_28px_36px] gap-x-1 px-3 py-3 items-center text-sm border-b border-gray-800/50 last:border-0 ${
              qualified ? 'bg-emerald-500/5' : ''
            }`}
          >
            <span className={`text-center font-bold text-xs ${qualified ? 'text-emerald-400' : 'text-gray-500'}`}>
              {t.rank}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{DRAPEAUX[t.team] ?? '🏳️'}</span>
              <span className={`truncate font-medium ${qualified ? 'text-white' : 'text-gray-300'}`}>
                {t.team}
              </span>
            </div>
            <span className={`text-center font-bold ${qualified ? 'text-emerald-400' : 'text-white'}`}>
              {t.pts}
            </span>
            <span className="text-center text-gray-400">{t.played}</span>
            <span className="text-center text-emerald-400/80">{t.win}</span>
            <span className="text-center text-yellow-400/70">{t.draw}</span>
            <span className="text-center text-red-400/70">{t.lose}</span>
            <span className={`text-center font-medium text-xs ${t.goalDiff > 0 ? 'text-emerald-400' : t.goalDiff < 0 ? 'text-red-400' : 'text-gray-500'}`}>
              {t.goalDiff > 0 ? `+${t.goalDiff}` : t.goalDiff}
            </span>
          </div>
        )
      })}

      {/* Légende */}
      <div className="flex items-center gap-4 px-3 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/40" />
          <span className="text-xs text-gray-500">Qualifié (top 2)</span>
        </div>
        {!live && (
          <span className="text-xs text-gray-600">Classement provisoire — compétition non débutée</span>
        )}
      </div>
    </div>
  )
}

export default function GroupesClient({ standings }: { standings: GroupStandingData[] }) {
  const [activeGroup, setActiveGroup] = useState('A')
  const groupKeys = Object.keys(CDM_GROUPS)
  const currentStanding = standings.find(s => s.group === activeGroup)
    ?? { group: activeGroup, standings: [], live: false }

  const groupFixtures = CDM_FIXTURES.filter(f => f.groupe === activeGroup)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      {/* Onglets groupes */}
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
            Gr. {g}
          </button>
        ))}
      </div>

      {/* Classement */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Groupe {activeGroup}</h2>
          <div className="flex items-center gap-2">
            {CDM_GROUPS[activeGroup as keyof typeof CDM_GROUPS]?.host && (
              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                🏟️ {CDM_GROUPS[activeGroup as keyof typeof CDM_GROUPS].host}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              currentStanding.live
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {currentStanding.live ? '● Live' : 'Pré-tournoi'}
            </span>
          </div>
        </div>
        <StandingsTable standings={currentStanding.standings} live={currentStanding.live} />
      </div>

      {/* Matchs du groupe */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-10">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Matchs — Groupe {activeGroup}</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {groupFixtures.map((f) => {
            const isPast = f.date < today
            const isToday = f.date === today
            return (
              <Link
                key={f.id}
                href={`/cdm/matchup/${f.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/50 transition-colors group"
              >
                <div className="text-xs text-gray-500 w-16 shrink-0">
                  {new Date(`${f.date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  {isToday && <span className="block text-emerald-400 font-bold">Aujourd'hui</span>}
                </div>
                <span className="text-emerald-400 text-xs font-medium w-10 shrink-0">{f.heure}</span>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span>{f.flagD}</span>
                  <span className={`text-sm truncate ${isPast ? 'text-gray-500' : 'text-white group-hover:text-emerald-400 transition-colors'}`}>
                    {f.domicile}
                  </span>
                  <span className="text-gray-600 text-xs mx-1">vs</span>
                  <span className={`text-sm truncate ${isPast ? 'text-gray-500' : 'text-white group-hover:text-emerald-400 transition-colors'}`}>
                    {f.exterieur}
                  </span>
                  <span>{f.flagE}</span>
                </div>
                <span className="text-gray-600 text-xs shrink-0 group-hover:text-gray-400">→</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Vue d'ensemble compacte */}
      <h2 className="text-xl font-bold mb-4 text-gray-300">Vue d'ensemble</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {groupKeys.map((g) => {
          const gStanding = standings.find(s => s.group === g)
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-emerald-500 transition-colors"
            >
              <p className="text-emerald-400 font-bold mb-2">Groupe {g}</p>
              {(gStanding?.standings ?? CDM_GROUPS[g as keyof typeof CDM_GROUPS].teams.map((t, i) => ({ rank: i+1, team: t, pts: 0 }))).map((t) => (
                <p key={t.team} className="text-sm text-gray-400 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1">
                    <span>{DRAPEAUX[t.team] ?? '🏳️'}</span>
                    <span className="truncate">{t.team}</span>
                  </span>
                  {gStanding?.live && (
                    <span className="text-xs font-bold text-emerald-400 shrink-0">{t.pts}pts</span>
                  )}
                </p>
              ))}
            </button>
          )
        })}
      </div>
    </>
  )
}
