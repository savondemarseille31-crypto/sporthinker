import { getCdmFixtures, getCdmStandings } from '@/lib/api-football'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default async function CdmPage() {
  let standings = []
  let fixtures = []

  try {
    standings = await getCdmStandings()
    fixtures = await getCdmFixtures()
  } catch (e) {
    console.error(e)
  }

  const prochainMatchs = fixtures
    ?.filter((f: any) => f.fixture.status.short === 'NS')
    ?.slice(0, 6) || []

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <nav className="flex gap-6 text-sm text-gray-400">
          <Link href="/cdm" className="text-emerald-400 font-semibold">🌍 CdM 2026</Link>
          <Link href="/nba" className="hover:text-emerald-400 transition-colors">🏀 NBA</Link>
          <Link href="/paris" className="hover:text-emerald-400 transition-colors">💰 Mes Paris</Link>
        </nav>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🌍 Coupe du Monde 2026</h1>
          <p className="text-gray-400">USA · Canada · Mexique — 48 équipes</p>
        </div>

        {/* Prochains matchs */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-emerald-400">Prochains matchs</h2>
          {prochainMatchs.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
              <p className="text-4xl mb-3">⏳</p>
              <p>Les matchs seront disponibles à l'ouverture du tournoi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prochainMatchs.map((f: any) => (
                <div key={f.fixture.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors">
                  <p className="text-xs text-gray-500 mb-3">{new Date(f.fixture.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-center flex-1">
                      <img src={f.teams.home.logo} alt={f.teams.home.name} className="w-10 h-10 mx-auto mb-1" />
                      <p className="text-sm font-semibold">{f.teams.home.name}</p>
                    </div>
                    <div className="text-emerald-400 font-bold text-lg">VS</div>
                    <div className="text-center flex-1">
                      <img src={f.teams.away.logo} alt={f.teams.away.name} className="w-10 h-10 mx-auto mb-1" />
                      <p className="text-sm font-semibold">{f.teams.away.name}</p>
                    </div>
                  </div>
                  <Link href={`/cdm/match/${f.fixture.id}`} className="mt-4 block text-center text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-lg transition-colors">
                    Analyser →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Groupes */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-emerald-400">Groupes</h2>
          {standings.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p>Les groupes seront disponibles prochainement</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {standings.map((group: any) => (
                <div key={group[0]?.group} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-bold text-emerald-400 mb-3">Groupe {group[0]?.group}</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs">
                        <th className="text-left pb-2">Équipe</th>
                        <th className="pb-2">J</th>
                        <th className="pb-2">G</th>
                        <th className="pb-2">N</th>
                        <th className="pb-2">P</th>
                        <th className="pb-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((team: any) => (
                        <tr key={team.team.id} className="border-t border-gray-800">
                          <td className="py-2 flex items-center gap-2">
                            <img src={team.team.logo} alt={team.team.name} className="w-5 h-5" />
                            {team.team.name}
                          </td>
                          <td className="text-center py-2">{team.all.played}</td>
                          <td className="text-center py-2">{team.all.win}</td>
                          <td className="text-center py-2">{team.all.draw}</td>
                          <td className="text-center py-2">{team.all.lose}</td>
                          <td className="text-center py-2 font-bold text-emerald-400">{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
