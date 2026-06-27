import Link from 'next/link'
import Header from '@/components/Header'
import CalendrierClient from './CalendrierClient'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { getWcResults } from '@/lib/api-football'

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
const teamEq = (a: string, b: string) => { const x = normTeam(a), y = normTeam(b); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)) }

export default async function CalendrierPage() {
  // Enrichit les fixtures statiques avec les vrais scores/statuts (API-Football).
  const api = await getWcResults().catch(() => [])
  const fixtures = CDM_FIXTURES.map(f => {
    // Match par paire d'équipes uniquement (chaque paire ne joue qu'une fois en poule)
    // → robuste aux décalages de date (fuseaux) et aux noms (Türkiye/Turkey…).
    const af = api.find(x =>
      (teamEq(x.teams.home.name, f.domicile) && teamEq(x.teams.away.name, f.exterieur)) ||
      (teamEq(x.teams.home.name, f.exterieur) && teamEq(x.teams.away.name, f.domicile)))
    if (!af) return { ...f }
    const homeIsDom = teamEq(af.teams.home.name, f.domicile)
    return {
      ...f,
      statut: af.fixture.status.short,
      scoreDom: af.goals.home == null ? null : (homeIsDom ? af.goals.home : af.goals.away),
      scoreExt: af.goals.away == null ? null : (homeIsDom ? af.goals.away : af.goals.home),
    }
  })

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">← Retour CdM 2026</Link>
          <h1 className="text-4xl font-bold mt-2 mb-1">Calendrier CdM 2026</h1>
          <p className="text-gray-400">Phase de groupes · Du 11 juin au 27 juin 2026 · {CDM_FIXTURES.length} matchs</p>
        </div>
        <CalendrierClient fixtures={fixtures} />
      </div>
    </main>
  )
}
