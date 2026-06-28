import Link from 'next/link'
import Header from '@/components/Header'
import { getWcResults } from '@/lib/api-football'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'

export const revalidate = 600 // résultats rafraîchis toutes les 10 min

// Normaliseur de noms (mêmes alias que le calendrier) → pour retrouver les drapeaux.
const ALIAS: Record<string, string> = {
  turkiye: 'turkey', cotedivoire: 'ivorycoast', korearepublic: 'southkorea', korea: 'southkorea',
  unitedstates: 'usa', czechrepublic: 'czechia', bosniaandherzegovina: 'bosniaherzegovina',
  congodr: 'drcongo', capeverdeislands: 'capeverde',
}
function normTeam(s: string): string {
  let n = (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
  n = n.replace(/^republicof/, '').replace(/republic$/, '')
  return ALIAS[n] ?? n
}
const FLAG: Record<string, string> = {}
for (const f of CDM_FIXTURES) { FLAG[normTeam(f.domicile)] = f.flagD; FLAG[normTeam(f.exterieur)] = f.flagE }
const flagOf = (name: string) => FLAG[normTeam(name)] ?? '🏳️'

const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', '3rd Place Final', 'Final']
const ROUND_LABEL: Record<string, string> = {
  'Round of 32': '16es de finale', 'Round of 16': '8es de finale', 'Quarter-finals': 'Quarts de finale',
  'Semi-finals': 'Demi-finales', '3rd Place Final': 'Match pour la 3e place', 'Final': 'Finale',
}
const LIVE = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function PhasesFinalesPage() {
  const api = await getWcResults().catch(() => [] as any[])
  const ko = api.filter((f: any) => !/group/i.test(f.league.round))
  const byRound: Record<string, any[]> = {}
  for (const f of ko) (byRound[f.league.round] ??= []).push(f)
  const rounds = [
    ...ROUND_ORDER.filter(r => byRound[r]?.length),
    ...Object.keys(byRound).filter(r => !ROUND_ORDER.includes(r)),
  ]

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />
      <div className="px-6 py-8 max-w-3xl mx-auto">
        <Link href="/cdm" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">← Retour CdM 2026</Link>
        <h1 className="text-4xl font-bold mt-2 mb-1">Phases finales 🏆</h1>
        <p className="text-gray-400 mb-8">Tableau à élimination directe · mis à jour automatiquement</p>

        {ko.length === 0 ? (
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 text-center text-gray-400">
            Les matchs à élimination directe apparaîtront ici dès qu&apos;ils seront programmés (fin de phase de groupes).
          </div>
        ) : rounds.map(round => {
          const matches = byRound[round].slice().sort((a: any, b: any) => a.fixture.date.localeCompare(b.fixture.date))
          return (
            <section key={round} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xl font-bold">{ROUND_LABEL[round] ?? round}</h2>
                <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">{matches.length} match{matches.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {matches.map((m: any) => {
                  const h = m.teams.home.name, a = m.teams.away.name
                  const live = LIVE.includes(m.fixture.status.short)
                  const done = ['FT', 'AET', 'PEN'].includes(m.fixture.status.short)
                  const hasScore = m.goals.home != null && m.goals.away != null
                  return (
                    <div key={m.fixture.id} className="bg-[#14171f] border border-[#262b36] rounded-xl px-5 py-4">
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                        <span className="capitalize">{new Date(m.fixture.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-violet-400 font-medium">{new Date(m.fixture.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}</span>
                        <span className="ml-auto truncate hidden sm:block">📍 {m.fixture.venue?.name ?? ''}</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl shrink-0">{flagOf(h)}</span>
                          <span className="font-semibold text-white truncate">{h}</span>
                        </div>
                        {hasScore ? (
                          <div className="flex flex-col items-center min-w-[3.25rem] shrink-0">
                            <span className="font-bold text-lg text-white tabular-nums">{m.goals.home} <span className="text-gray-600 font-normal">–</span> {m.goals.away}</span>
                            {live
                              ? <span className="text-[10px] font-semibold text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{m.fixture.status.short}</span>
                              : done ? <span className="text-[10px] text-gray-600 uppercase tracking-wide">terminé</span> : null}
                          </div>
                        ) : (
                          <span className="text-violet-400 font-bold text-sm w-12 text-center shrink-0">VS</span>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-semibold text-white truncate">{a}</span>
                          <span className="text-xl shrink-0">{flagOf(a)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
