import Header from '@/components/Header'
import Link from 'next/link'
import { getTopPitchers, getTopHitters, MLB_TEAMS } from '@/lib/mlb-api'

export const dynamic = 'force-dynamic'

export default async function JoueursMLBPage() {
  const [pitchers, hitters] = await Promise.all([getTopPitchers(20), getTopHitters(20)])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        <Link href="/mlb" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour MLB</Link>
        <h1 className="text-3xl font-bold mt-2 mb-1">👤 Top joueurs MLB 2026</h1>
        <p className="text-gray-400 text-sm mb-6">Stats avancées pour identifier les lanceurs et frappeurs à surveiller en paris</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top lanceurs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-emerald-400">🥎 Top lanceurs — ERA</h2>
              <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">Qualifiés</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-1 px-4 py-2 text-xs text-gray-500 border-b border-gray-800">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Lanceur</span>
                <span className="col-span-2 text-center">ERA</span>
                <span className="col-span-2 text-center">WHIP</span>
                <span className="col-span-1 text-center">V</span>
                <span className="col-span-1 text-center">D</span>
                <span className="col-span-1 text-center">K</span>
              </div>
              {pitchers.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">Données indisponibles</div>
              ) : (
                pitchers.map((p, i) => {
                  const info = MLB_TEAMS[p.team?.id]
                  const era = parseFloat(String(p.stat?.era ?? '99'))
                  const eraColor = era < 2.5 ? 'text-emerald-400' : era < 3.5 ? 'text-yellow-400' : era < 4.5 ? 'text-orange-400' : 'text-red-400'
                  return (
                    <div key={p.player.id}
                      className="grid grid-cols-12 gap-1 px-4 py-2.5 text-sm border-b border-gray-800/50 last:border-0 items-center hover:bg-gray-800/50 transition-colors">
                      <span className="col-span-1 text-gray-600 text-xs">{i + 1}</span>
                      <div className="col-span-4">
                        <p className="font-semibold text-xs leading-tight">{p.player.fullName}</p>
                        <p className="text-xs text-gray-500">{info?.emoji} {info?.shortName ?? p.team?.abbreviation}</p>
                      </div>
                      <span className={`col-span-2 text-center font-bold ${eraColor}`}>{p.stat?.era ?? '—'}</span>
                      <span className="col-span-2 text-center text-gray-300">{p.stat?.whip ?? '—'}</span>
                      <span className="col-span-1 text-center text-emerald-400">{p.stat?.wins ?? '—'}</span>
                      <span className="col-span-1 text-center text-red-400">{p.stat?.losses ?? '—'}</span>
                      <span className="col-span-1 text-center text-gray-400">{p.stat?.strikeOuts ?? '—'}</span>
                    </div>
                  )
                })
              )}
            </div>
            <div className="mt-2 p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-500">
              <p>💡 <strong className="text-white">Conseil paris :</strong> ERA &lt; 3.00 + WHIP &lt; 1.10 = lanceur dominant → value sur l'équipe + under total</p>
            </div>
          </section>

          {/* Top frappeurs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-emerald-400">🏏 Top frappeurs — AVG</h2>
              <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">Qualifiés</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-1 px-4 py-2 text-xs text-gray-500 border-b border-gray-800">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Frappeur</span>
                <span className="col-span-2 text-center">AVG</span>
                <span className="col-span-2 text-center">OPS</span>
                <span className="col-span-1 text-center">HR</span>
                <span className="col-span-1 text-center">RBI</span>
                <span className="col-span-1 text-center">R</span>
              </div>
              {hitters.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">Données indisponibles</div>
              ) : (
                hitters.map((h, i) => {
                  const info = MLB_TEAMS[h.team?.id]
                  const avg = parseFloat(String(h.stat?.avg ?? '0'))
                  const avgColor = avg >= 0.300 ? 'text-emerald-400' : avg >= 0.270 ? 'text-yellow-400' : 'text-white'
                  return (
                    <div key={h.player.id}
                      className="grid grid-cols-12 gap-1 px-4 py-2.5 text-sm border-b border-gray-800/50 last:border-0 items-center hover:bg-gray-800/50 transition-colors">
                      <span className="col-span-1 text-gray-600 text-xs">{i + 1}</span>
                      <div className="col-span-4">
                        <p className="font-semibold text-xs leading-tight">{h.player.fullName}</p>
                        <p className="text-xs text-gray-500">{info?.emoji} {info?.shortName ?? h.team?.abbreviation}</p>
                      </div>
                      <span className={`col-span-2 text-center font-bold ${avgColor}`}>{h.stat?.avg ?? '—'}</span>
                      <span className="col-span-2 text-center text-gray-300">{h.stat?.ops ?? '—'}</span>
                      <span className="col-span-1 text-center text-orange-400">{h.stat?.homeRuns ?? '—'}</span>
                      <span className="col-span-1 text-center text-gray-400">{h.stat?.rbi ?? '—'}</span>
                      <span className="col-span-1 text-center text-gray-400">{h.stat?.runs ?? '—'}</span>
                    </div>
                  )
                })
              )}
            </div>
            <div className="mt-2 p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-500">
              <p>💡 <strong className="text-white">Conseil paris :</strong> AVG &gt; .300 + OPS &gt; .900 = frappeur chaud → value sur buteur / over total</p>
            </div>
          </section>
        </div>

        {/* Glossaire */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-emerald-400 mb-3">📖 Glossaire stats MLB</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-400">
            {[
              { stat: 'ERA', desc: 'Moyenne de points mérités sur 9 manches — plus bas = meilleur' },
              { stat: 'WHIP', desc: 'Buts sur balles + coups sûrs par manche — &lt;1.00 = excellent' },
              { stat: 'AVG', desc: 'Moyenne au bâton — &gt;.300 = frappeur d\'élite' },
              { stat: 'OPS', desc: 'OBP + SLG — mesure globale offensive, &gt;.900 = excellent' },
              { stat: 'HR', desc: 'Home Runs — coups de circuit' },
              { stat: 'RBI', desc: 'Points produits — indicateur d\'impact offensif' },
            ].map(g => (
              <div key={g.stat} className="bg-gray-800 rounded-xl p-2.5">
                <p className="font-bold text-white mb-0.5">{g.stat}</p>
                <p>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
