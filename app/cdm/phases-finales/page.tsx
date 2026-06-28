import Link from 'next/link'
import Header from '@/components/Header'
import { getWcResults } from '@/lib/api-football'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'

export const revalidate = 600 // résultats rafraîchis toutes les 10 min

/* eslint-disable @typescript-eslint/no-explicit-any */

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

// Structure standard du tableau final (CdM 2026, format à 48 → 32es éliminatoires).
const STD: { round: string; label: string; slots: number }[] = [
  { round: 'Round of 32', label: '16es de finale', slots: 16 },
  { round: 'Round of 16', label: '8es de finale', slots: 8 },
  { round: 'Quarter-finals', label: 'Quarts', slots: 4 },
  { round: 'Semi-finals', label: 'Demies', slots: 2 },
  { round: 'Final', label: 'Finale', slots: 1 },
]
const LIVE = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']

function winnerOf(m: any): 'home' | 'away' | null {
  if (!['FT', 'AET', 'PEN'].includes(m.fixture.status.short)) return null
  const gh = m.goals.home, ga = m.goals.away
  if (gh > ga) return 'home'
  if (ga > gh) return 'away'
  const ph = m.score?.penalty?.home, pa = m.score?.penalty?.away
  if (ph != null && pa != null) { if (ph > pa) return 'home'; if (pa > ph) return 'away' }
  return null
}

// Une équipe dans une cellule de bracket.
function TeamRow({ name, isWinner, decided, score, pen }: { name: string; isWinner: boolean; decided: boolean; score: number | null; pen?: number | null }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${decided && !isWinner ? 'opacity-45' : ''}`}>
      <span className="text-base shrink-0">{flagOf(name)}</span>
      <span className={`flex-1 min-w-0 truncate text-sm ${isWinner ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>{name}</span>
      {score != null && (
        <span className={`text-sm tabular-nums shrink-0 ${isWinner ? 'font-bold text-white' : 'text-gray-400'}`}>
          {score}{pen != null && <span className="text-[10px] text-gray-500 ml-0.5">({pen})</span>}
        </span>
      )}
    </div>
  )
}

// Cellule de match (réelle, cliquable).
function MatchCell({ m }: { m: any }) {
  const w = winnerOf(m)
  const decided = w != null || ['FT', 'AET', 'PEN'].includes(m.fixture.status.short)
  const live = LIVE.includes(m.fixture.status.short)
  const hasScore = m.goals.home != null && m.goals.away != null
  const dt = new Date(m.fixture.date)
  const penH = m.fixture.status.short === 'PEN' ? m.score?.penalty?.home : null
  const penA = m.fixture.status.short === 'PEN' ? m.score?.penalty?.away : null
  return (
    <Link
      href={`/cdm/matchup/${m.fixture.id}`}
      className="block bg-[#14171f] border border-[#262b36] rounded-xl overflow-hidden hover:border-violet-500 transition-colors divide-y divide-[#262b36]"
    >
      <TeamRow name={m.teams.home.name} isWinner={w === 'home'} decided={decided} score={hasScore ? m.goals.home : null} pen={penH} />
      <TeamRow name={m.teams.away.name} isWinner={w === 'away'} decided={decided} score={hasScore ? m.goals.away : null} pen={penA} />
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-gray-500 bg-[#0f1219]">
        {live ? (
          <span className="text-red-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{m.fixture.status.short}
          </span>
        ) : decided ? (
          <span className="uppercase tracking-wide">terminé</span>
        ) : (
          <>
            <span className="capitalize">{dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            <span>·</span>
            <span className="text-violet-400">{dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}</span>
          </>
        )}
        <span className="ml-auto text-gray-600">analyse →</span>
      </div>
    </Link>
  )
}

// Slot encore vide (tour pas encore tiré).
function GhostCell() {
  return (
    <div className="rounded-xl border border-dashed border-[#262b36]/70 bg-[#11141b] divide-y divide-[#262b36]/50">
      <div className="px-3 py-2 text-sm text-gray-600">À déterminer</div>
      <div className="px-3 py-2 text-sm text-gray-600">À déterminer</div>
    </div>
  )
}

export default async function PhasesFinalesPage() {
  const api = await getWcResults().catch(() => [] as any[])
  const ko = api.filter((f: any) => !/group/i.test(f.league.round))
  const byRound: Record<string, any[]> = {}
  for (const f of ko) (byRound[f.league.round] ??= []).push(f)

  const drawn = ko.length > 0
  // 3e place : affiché à part (hors arbre principal).
  const thirdPlace = (byRound['3rd Place Final'] ?? []).slice().sort((a: any, b: any) => a.fixture.date.localeCompare(b.fixture.date))

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <Link href="/cdm" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">← Retour CdM 2026</Link>
        <h1 className="text-4xl font-bold mt-2 mb-1">Phases finales 🏆</h1>
        <p className="text-gray-400 mb-8">Tableau à élimination directe · mis à jour automatiquement · clique un match pour l&apos;analyse</p>

        {!drawn ? (
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 text-center text-gray-400">
            Les matchs à élimination directe apparaîtront ici dès qu&apos;ils seront programmés (fin de phase de groupes).
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-4 -mx-6 px-6">
              <div className="flex gap-4 items-stretch min-w-max">
                {STD.map(({ round, label, slots }) => {
                  const matches = (byRound[round] ?? []).slice().sort((a: any, b: any) => a.fixture.date.localeCompare(b.fixture.date))
                  const ghosts = Math.max(0, slots - matches.length)
                  return (
                    <div key={round} className="shrink-0 w-[230px] flex flex-col">
                      <div className="text-center mb-3">
                        <h2 className="text-sm font-bold text-violet-400">{label}</h2>
                        <p className="text-[10px] text-gray-600 uppercase tracking-wide">{slots} match{slots > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex-1 flex flex-col justify-around gap-3">
                        {matches.map((m: any) => <MatchCell key={m.fixture.id} m={m} />)}
                        {Array.from({ length: ghosts }).map((_, i) => <GhostCell key={`ghost-${round}-${i}`} />)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {thirdPlace.length > 0 && (
              <section className="mt-8 max-w-sm">
                <h2 className="text-sm font-bold text-gray-400 mb-3">🥉 Match pour la 3e place</h2>
                {thirdPlace.map((m: any) => <MatchCell key={m.fixture.id} m={m} />)}
              </section>
            )}

            <p className="text-xs text-gray-600 mt-6">Fais défiler horizontalement pour voir tout le tableau. Les vainqueurs sont mis en avant ; les slots « à déterminer » se rempliront automatiquement à chaque tour.</p>
          </>
        )}
      </div>
    </main>
  )
}
