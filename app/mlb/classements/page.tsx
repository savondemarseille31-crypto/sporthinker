import Header from '@/components/Header'
import Link from 'next/link'
import { getStandings, getL10, getHomeRecord, getAwayRecord, MLB_TEAMS } from '@/lib/mlb-api'

export const dynamic = 'force-dynamic'

export default async function ClassementsPage() {
  const standings = await getStandings()

  const al = standings.filter(s => s.division?.name?.includes('American'))
  const nl = standings.filter(s => s.division?.name?.includes('National'))

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        <Link href="/mlb" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour MLB</Link>
        <h1 className="text-3xl font-bold mt-2 mb-1">🏆 Classements MLB 2026</h1>
        <p className="text-gray-400 text-sm mb-6">Mis à jour toutes les 30 min · L10 = 10 derniers matchs</p>

        {standings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Données indisponibles</div>
        ) : (
          <div className="space-y-10">
            {[
              { label: '🇺🇸 Ligue Américaine (AL)', divs: al },
              { label: '🏟️ Ligue Nationale (NL)', divs: nl },
            ].map(({ label, divs }) => (
              <section key={label}>
                <h2 className="text-xl font-bold text-emerald-400 mb-4">{label}</h2>
                <div className="space-y-6">
                  {divs.map(div => (
                    <div key={div.division.id}>
                      <h3 className="text-sm font-bold text-gray-400 mb-2 px-1">
                        {(div.division?.name ?? '').replace('American League ', '').replace('National League ', '')} Division
                      </h3>
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        {/* Header tableau */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-gray-500 border-b border-gray-800">
                          <span className="col-span-4">Équipe</span>
                          <span className="col-span-1 text-center">V</span>
                          <span className="col-span-1 text-center">D</span>
                          <span className="col-span-1 text-center">%</span>
                          <span className="col-span-1 text-center">GB</span>
                          <span className="col-span-2 text-center">L10</span>
                          <span className="col-span-1 text-center">Dom</span>
                          <span className="col-span-1 text-center hidden md:block">Ext</span>
                        </div>

                        {div.teamRecords.map((tr, idx) => {
                          const info = MLB_TEAMS[tr.team.id]
                          const isFirst = idx === 0
                          return (
                            <div key={tr.team.id}
                              className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center border-b border-gray-800/50 last:border-0 ${isFirst ? 'bg-emerald-500/5' : ''}`}>
                              <div className="col-span-4 flex items-center gap-2">
                                <span className="text-lg">{info?.emoji ?? '⚾'}</span>
                                <div>
                                  <p className={`font-semibold ${isFirst ? 'text-emerald-400' : 'text-white'}`}>
                                    {info?.shortName ?? tr.team.abbreviation}
                                  </p>
                                  <p className="text-xs text-gray-600 hidden sm:block">{tr.team.teamName}</p>
                                </div>
                              </div>
                              <span className="col-span-1 text-center font-bold text-emerald-400">{tr.wins}</span>
                              <span className="col-span-1 text-center text-red-400">{tr.losses}</span>
                              <span className="col-span-1 text-center text-gray-300">.{tr.pct.replace('0.', '').replace('.', '')}</span>
                              <span className="col-span-1 text-center text-gray-500">
                                {tr.gamesBack === '-' ? '—' : tr.gamesBack}
                              </span>
                              <span className="col-span-2 text-center font-medium">
                                {getL10(tr.records)}
                              </span>
                              <span className="col-span-1 text-center text-xs text-gray-400">{getHomeRecord(tr.records)}</span>
                              <span className="col-span-1 text-center text-xs text-gray-400 hidden md:block">{getAwayRecord(tr.records)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-600 text-center">
          Source : MLB Stats API officielle · Données temps réel
        </div>
      </div>
    </main>
  )
}
