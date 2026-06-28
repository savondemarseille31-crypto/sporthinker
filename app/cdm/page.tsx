import Link from 'next/link'
import Header from '@/components/Header'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { CDM_GROUPS } from '@/lib/cdm-groups'
import CdmCountdown from '@/components/CdmCountdown'
import { getWcResults } from '@/lib/api-football'

/* eslint-disable @typescript-eslint/no-explicit-any */
const ALIAS: Record<string, string> = { turkiye: 'turkey', cotedivoire: 'ivorycoast', korearepublic: 'southkorea', korea: 'southkorea', unitedstates: 'usa', czechrepublic: 'czechia', bosniaandherzegovina: 'bosniaherzegovina', congodr: 'drcongo', capeverdeislands: 'capeverde' }
function normTeam(s: string): string { let n = (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, ''); n = n.replace(/^republicof/, '').replace(/republic$/, ''); return ALIAS[n] ?? n }
const CANON: Record<string, string> = {}; const FLAG: Record<string, string> = {}
for (const f of CDM_FIXTURES) { CANON[normTeam(f.domicile)] = f.domicile; FLAG[normTeam(f.domicile)] = f.flagD; CANON[normTeam(f.exterieur)] = f.exterieur; FLAG[normTeam(f.exterieur)] = f.flagE }
const canonTeam = (n: string) => CANON[normTeam(n)] ?? n
const flagOf = (n: string) => FLAG[normTeam(n)] ?? '🏳️'
const ROUND_LABEL: Record<string, string> = { 'Round of 32': '16es de finale', 'Round of 16': '8es de finale', 'Quarter-finals': 'Quarts', 'Semi-finals': 'Demi-finales', '3rd Place Final': '3e place', 'Final': 'Finale' }
const roundLabel = (r: string) => /group stage/i.test(r) ? r.replace(/Group Stage - (\d)/, 'Poule · J$1') : (ROUND_LABEL[r] ?? r)

export const revalidate = 600

export default async function CdmPage() {
  const api = await getWcResults().catch(() => [] as any[])
  const now = Date.now()
  const prochainMatchs = (api as any[])
    .filter(f => new Date(f.fixture.date).getTime() > now)
    .sort((a, b) => String(a.fixture.date).localeCompare(String(b.fixture.date)))
    .slice(0, 6)

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">🌍 Coupe du Monde 2026</h1>
          <p className="text-gray-400">USA · Canada · Mexique · 11 juin – 19 juillet 2026</p>
        </div>

        {/* Compte à rebours */}
        <CdmCountdown />

        {/* Raccourcis */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <Link href="/cdm/groupes" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 hover:border-violet-500 transition-colors text-center">
            <div className="text-3xl mb-2">🗂️</div>
            <p className="font-semibold">Groupes</p>
            <p className="text-xs text-gray-500 mt-1">12 groupes · 48 équipes</p>
          </Link>
          <Link href="/cdm/equipes" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 hover:border-violet-500 transition-colors text-center">
            <div className="text-3xl mb-2">🌍</div>
            <p className="font-semibold">Équipes</p>
            <p className="text-xs text-gray-500 mt-1">Profils & forces/faiblesses</p>
          </Link>
          <Link href="/cdm/calendrier" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 hover:border-violet-500 transition-colors text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="font-semibold">Calendrier</p>
            <p className="text-xs text-gray-500 mt-1">72 matchs · Phase de groupes</p>
          </Link>
          <Link href="/cdm/phases-finales" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 hover:border-violet-500 transition-colors text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="font-semibold">Phases finales</p>
            <p className="text-xs text-gray-500 mt-1">Tableau à élimination directe</p>
          </Link>
          <Link href="/cdm/joueurs" className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 hover:border-violet-500 transition-colors text-center">
            <div className="text-3xl mb-2">👤</div>
            <p className="font-semibold">Joueurs</p>
            <p className="text-xs text-gray-500 mt-1">Stats & profils xG/xA</p>
          </Link>
          <Link href="/cdm/signaux" className="bg-[#14171f] border border-violet-500/40 rounded-2xl p-5 hover:border-violet-500 transition-colors text-center">
            <div className="text-3xl mb-2">⚡</div>
            <p className="font-semibold text-violet-400">Signaux</p>
            <p className="text-xs text-gray-500 mt-1">Props joueurs & matchs</p>
          </Link>
        </div>

        {/* Prochains matchs */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-violet-400">Prochains matchs</h2>
            <Link href="/cdm/phases-finales" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Voir tout →</Link>
          </div>
          {prochainMatchs.length === 0 ? (
            <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 text-center text-gray-400">Aucun match à venir pour le moment.</div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prochainMatchs.map((m: any) => {
              const dt = new Date(m.fixture.date)
              return (
                <div key={m.fixture.id} className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">{roundLabel(m.league.round)}</span>
                    <span className="text-xs text-gray-500">{dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })} · {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_40px_1fr] items-center">
                    <div className="text-center">
                      <p className="text-2xl mb-1">{flagOf(m.teams.home.name)}</p>
                      <p className="text-sm font-semibold">{canonTeam(m.teams.home.name)}</p>
                    </div>
                    <div className="text-violet-400 font-bold text-center">VS</div>
                    <div className="text-center">
                      <p className="text-2xl mb-1">{flagOf(m.teams.away.name)}</p>
                      <p className="text-sm font-semibold">{canonTeam(m.teams.away.name)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </section>

        {/* Groupes aperçu */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-violet-400">Groupes</h2>
            <Link href="/cdm/groupes" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.keys(CDM_GROUPS).map((g) => (
              <Link key={g} href={`/cdm/groupes`} className="bg-[#14171f] border border-[#262b36] rounded-xl p-4 hover:border-violet-500 transition-colors">
                <p className="text-violet-400 font-bold mb-2">Groupe {g}</p>
                {CDM_GROUPS[g as keyof typeof CDM_GROUPS].teams.map((t) => (
                  <p key={t} className="text-xs text-gray-400">{t}</p>
                ))}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
