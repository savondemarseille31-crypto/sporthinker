import Header from '@/components/Header'
import Link from 'next/link'
import { getTopPitchers, getTopHitters, MLB_TEAMS } from '@/lib/mlb-api'

export const revalidate = 3600 // 1h — stats saison lanceurs/frappeurs

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

        {/* Lien guide */}
        <div className="mt-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-emerald-400 mb-1">📖 Tu débutes sur le MLB ?</p>
            <p className="text-sm text-gray-400">Consulte notre guide complet : ERA, WHIP, OPS, types de paris et stratégies expliqués pour les parieurs débutants.</p>
          </div>
          <Link href="/mlb/guide"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl transition-colors text-sm">
            Lire le guide →
          </Link>
        </div>
      </div>
    </main>
  )
}
