import Link from 'next/link'
import Header from '@/components/Header'
import {
  getTrackRecord,
  computeStats,
  bySport,
  byConfidence,
  statsByMonth,
  equityCurve,
  CONF_ORDER,
  type TrackEntry,
  type TrackStats,
} from '@/lib/track-record'
import { getSelectionsTrackEntries } from '@/lib/track-record/selections'
import { getSignalHistoryTrackEntries } from '@/lib/track-record/signal-history'
import { getPropStats } from '@/lib/track-record/prop-history'

export const dynamic = 'force-dynamic' // lit Supabase (sélections) — jamais prérendu au build

export const metadata = {
  title: 'Performance — track record public',
  description:
    'Track record 100 % public et vérifiable de Deltavyn : tous les paris analysés, gagnants et perdants, en unités et yield.',
}

const SPORT_ICONS: Record<string, string> = {
  MLB: '⚾', CdM: '🌍', NBA: '🏀', Tennis: '🎾', MLS: '⚽',
}

function fmtUnits(u: number): string {
  return `${u >= 0 ? '+' : ''}${u.toFixed(2)} u`
}
function fmtPct(p: number): string {
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)} %`
}
function fmtDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  if (!m) return d // format non-ISO (ex. sélections) → affiché tel quel
  return `${m[3]}/${m[2]}/${m[1].slice(2)}`
}

const CONF_META: Record<string, { label: string; cls: string }> = {
  'fort':         { label: '⚡ Fort',                cls: 'bg-emerald-500/15 text-emerald-400' },
  'modéré':       { label: '🔶 Modéré',             cls: 'bg-yellow-500/15 text-yellow-400' },
  'à surveiller': { label: '👁 À surveiller',        cls: 'bg-gray-700 text-gray-400' },
  'excellent':    { label: '⚡ Excellent (>8%)',     cls: 'bg-emerald-500/15 text-emerald-400' },
  'bon':          { label: '✅ Bon (5-8%)',          cls: 'bg-blue-500/15 text-blue-400' },
  'interessant':  { label: '🔍 Intéressant (3-5%)',  cls: 'bg-yellow-500/15 text-yellow-400' },
}

function ForceBadge({ c }: { c: string | null }) {
  if (!c) return <span className="text-xs text-gray-600">—</span>
  const m = CONF_META[c] ?? { label: c, cls: 'bg-gray-700 text-gray-400' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>
}

function KpiCard({ label, value, color = 'text-white' }: {
  label: string; value: string; color?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// Graduations « rondes » pour l'axe Y.
function niceTicks(min: number, max: number, count = 4): number[] {
  const span = (max - min) || 1
  const rawStep = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag
  const start = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(parseFloat(v.toFixed(2)))
  return ticks
}

// Courbe de capital cumulé EN UNITÉS — SVG léger (rendu serveur), avec axes X (dates) et Y (unités).
function EquityCurve({ points }: { points: { date: string; cumUnits: number }[] }) {
  if (points.length < 2) return null
  const W = 1000, H = 320, ML = 52, MR = 16, MT = 16, MB = 30
  const plotW = W - ML - MR, plotH = H - MT - MB
  const ys = points.map(p => p.cumUnits)
  const minY = Math.min(0, ...ys)
  const maxY = Math.max(0, ...ys) + (Math.max(...ys) - Math.min(0, ...ys)) * 0.08 || 1
  const range = (maxY - minY) || 1
  const X = (i: number) => ML + (i / (points.length - 1)) * plotW
  const Y = (v: number) => MT + (1 - (v - minY) / range) * plotH
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(p.cumUnits).toFixed(1)}`).join('')
  const area = `${line}L${X(points.length - 1).toFixed(1)},${Y(minY).toFixed(1)}L${X(0).toFixed(1)},${Y(minY).toFixed(1)}Z`
  const up = points[points.length - 1].cumUnits >= 0
  const color = up ? '#34d399' : '#f87171'
  const yTicks = niceTicks(minY, maxY, 4)
  const last = points.length - 1
  const xIdx = [...new Set([0, Math.round(last / 3), Math.round((2 * last) / 3), last])]
  const fmtDate = (d: string) => { const [, m, dd] = d.split('-'); return `${dd}/${m}` }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Capital cumulé en unités au fil du temps">
      <defs>
        <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grille + échelle Y (unités) */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={ML} x2={W - MR} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? '#475569' : '#1f2937'} strokeWidth="1" strokeDasharray={t === 0 ? '6 6' : undefined} />
          <text x={ML - 8} y={Y(t) + 4} textAnchor="end" fontSize="13" fill="#6b7280">{t > 0 ? `+${t}` : t} u</text>
        </g>
      ))}
      {/* Échelle X (dates) */}
      {xIdx.map(i => (
        <text key={i} x={X(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="#6b7280">{fmtDate(points[i].date)}</text>
      ))}
      <path d={area} fill="url(#eqfill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function StatsGrid({ stats }: { stats: TrackStats }) {
  const yieldColor = stats.yield >= 0 ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard label="Paris soldés" value={String(stats.n)} />
      <KpiCard label="Réussite" value={`${stats.winRate.toFixed(1)} %`} />
      <KpiCard label="Yield" value={fmtPct(stats.yield)} color={yieldColor} />
      <KpiCard label="Profit (unités)" value={fmtUnits(stats.profitUnits)} color={yieldColor} />
      <KpiCard label="Cote moyenne" value={stats.avgOdds.toFixed(2)} />
    </div>
  )
}

function ConfidenceBreakdown({ entries }: { entries: TrackEntry[] }) {
  const groups = byConfidence(entries)
  const levels = CONF_ORDER.filter(l => groups[l]?.length)
  if (!levels.length) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      {levels.map(l => {
        const s = computeStats(groups[l])
        const yc = s.yield >= 0 ? 'text-emerald-400' : 'text-red-400'
        return (
          <div key={l} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="mb-3"><ForceBadge c={l} /></div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div><p className="text-lg font-bold text-white">{s.n}</p><p className="text-xs text-gray-500">Paris</p></div>
              <div><p className="text-lg font-bold text-white">{s.winRate.toFixed(0)} %</p><p className="text-xs text-gray-500">Réussite</p></div>
              <div><p className={`text-lg font-bold ${yc}`}>{fmtPct(s.yield)}</p><p className="text-xs text-gray-500">Yield</p></div>
              <div><p className={`text-lg font-bold ${yc}`}>{fmtUnits(s.profitUnits)}</p><p className="text-xs text-gray-500">Profit</p></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResultsTable({ entries }: { entries: TrackEntry[] }) {
  const rows = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Match</th>
            <th className="px-4 py-3 font-medium">Pari</th>
            <th className="px-4 py-3 font-medium">Confiance</th>
            <th className="px-4 py-3 font-medium text-right">Cote</th>
            <th className="px-4 py-3 font-medium text-right">Résultat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(e => (
            <tr key={e.id} className="border-b border-gray-800/60 last:border-0">
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(e.date)}</td>
              <td className="px-4 py-3 text-gray-300">
                <span className="mr-1">{SPORT_ICONS[e.sport] ?? '•'}</span>{e.match}
              </td>
              <td className="px-4 py-3 font-medium text-white">{e.selection}</td>
              <td className="px-4 py-3"><ForceBadge c={e.confiance} /></td>
              <td className="px-4 py-3 text-right text-gray-300">{e.cote.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">
                {e.resultat === 'won' ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Gagné</span>
                ) : e.resultat === 'lost' ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Perdu</span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Annulé</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BetsByConfidence({ entries }: { entries: TrackEntry[] }) {
  const groups = byConfidence(entries)
  const levels = CONF_ORDER.filter(l => groups[l]?.length)
  if (!levels.length) return null
  return (
    <div>
      {levels.map(l => {
        const list = groups[l]
        return (
          <details key={l} className="group bg-gray-900 border border-gray-800 rounded-2xl mb-3 overflow-hidden">
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-gray-800/40">
              <span className="flex items-center gap-2">
                <ForceBadge c={l} />
                <span className="text-sm text-gray-400">{list.length} pari{list.length > 1 ? 's' : ''}</span>
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                Voir le détail
                <span className="transition-transform group-open:rotate-180">▾</span>
              </span>
            </summary>
            <div className="border-t border-gray-800">
              <ResultsTable entries={list} />
            </div>
          </details>
        )
      })}
    </div>
  )
}

export default async function PerformancePage() {
  let selections: TrackEntry[] = []
  try { selections = await getSelectionsTrackEntries() } catch { /* Supabase indispo — on garde l'historique MLB */ }
  let signalHistory: TrackEntry[] = []
  try { signalHistory = await getSignalHistoryTrackEntries() } catch { /* idem */ }
  const all = [...getTrackRecord(), ...selections, ...signalHistory]
  // Tennis : échantillon encore trop court / variance trop élevée pour publier un yield
  // représentatif (cf. audit). On l'exclut des chiffres publics, on affiche un message
  // « en construction » à la place. Les signaux tennis restent dispo dans /signaux.
  const published = all.filter(e => e.sport !== 'Tennis')
  const tennisCount = all.length - published.length
  // Global = signaux FORTS uniquement (nos meilleurs picks). Inclure modéré / à surveiller
  // tirerait les stats vers le bas ; ces niveaux sont suivis séparément par sport ci-dessous.
  const fort = published.filter(e => e.confiance === 'fort')
  const global = computeStats(fort)
  const equity = equityCurve(fort)
  const sports = bySport(published)
  const months = statsByMonth(published).filter(m => m.stats.n > 0) // tous niveaux, mois avec ≥1 pari soldé
  let propStats: Awaited<ReturnType<typeof getPropStats>> = { markets: [], total: 0 }
  try { propStats = await getPropStats() } catch { /* table indispo */ }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-1">📊 Performance</h1>
          <p className="text-gray-400">
            Track record <span className="text-emerald-400 font-semibold">100 % public</span> — tous les paris analysés,
            gagnants <span className="text-gray-300">et</span> perdants. Mesuré en <span className="text-gray-300">unités</span> (mise à plat, 1 u/pari).
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Périmètre actuel : <span className="text-emerald-400 font-medium">signaux forts MLB</span> (mai–juin 2026).
            Les prochains signaux seront suivis et distingués par niveau de confiance (⚡ fort · 🔶 modéré · 👁 à surveiller).
          </p>
        </div>

        {/* Disclaimer / conformité */}
        <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300 flex gap-3 items-start">
          <span className="text-lg mt-0.5">ℹ️</span>
          <p className="text-blue-400/90">
            Les <span className="font-semibold">performances passées ne préjugent pas des résultats futurs</span>.
            Deltavyn est un <span className="font-semibold">outil d&apos;analyse statistique</span>, n&apos;est pas un opérateur de jeux et ne prend aucun pari.
            Réservé aux <span className="font-semibold">18 ans et plus</span> — jeu responsable, Joueurs Info Service&nbsp;: 09 74 75 13 13.
          </p>
        </div>

        {/* Légende — comprendre les niveaux */}
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="font-semibold text-white mb-3">Comprendre les niveaux de signal</p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex gap-2 items-start">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">⚡ Fort</span>
              <span><span className="text-gray-200 font-medium">Nos meilleurs picks.</span> Écart statistique significatif (ERA/WHIP, classement Elo, xG) — c&apos;est là que se concentre l&apos;edge.</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 shrink-0">🔶 Modéré</span>
              <span>Avantage réel détecté, mais le match reste incertain.</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 shrink-0">👁 À surveiller</span>
              <span>Match intéressant à confiance plus faible — à jouer avec prudence.</span>
            </li>
          </ul>
          <p className="text-xs text-gray-600 mt-3">Chaque niveau est suivi <span className="text-gray-400">séparément</span> ci-dessous, par sport, pour une transparence totale.</p>
        </div>

        {/* Stats globales — signaux forts uniquement */}
        <section className="mb-10">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl font-bold">Global</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">⚡ Signaux forts uniquement</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Ces chiffres ne comptent que les signaux <span className="text-emerald-400 font-medium">forts</span> (nos meilleurs picks).
            Les niveaux <span className="text-yellow-400">modéré</span> et <span className="text-gray-400">à surveiller</span> sont suivis séparément, par sport, ci-dessous.
          </p>

          {equity.length >= 2 && (
            <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.07] to-gray-900 p-5 overflow-hidden">
              <div className="mb-3">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">📈 Capital cumulé · signaux forts</p>
                <p className={`text-3xl sm:text-4xl font-extrabold tabular-nums ${global.profitUnits >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtUnits(global.profitUnits)} <span className="text-base font-semibold text-gray-500">au total</span>
                </p>
                <p className="text-xs text-gray-500">
                  Profit cumulé en <span className="text-gray-400 font-medium">unités</span> (mise à plat, 1&nbsp;u/pari) sur {global.n} paris soldés — pas le ROI.
                </p>
              </div>
              <EquityCurve points={equity} />
            </div>
          )}

          <StatsGrid stats={global} />
        </section>

        {/* Performance par mois — tous niveaux confondus */}
        {months.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <h2 className="text-xl font-bold">Performance par mois</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">tous niveaux</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Mois</th>
                    <th className="px-4 py-3 text-right font-medium">Paris</th>
                    <th className="px-4 py-3 text-right font-medium">Réussite</th>
                    <th className="px-4 py-3 text-right font-medium">Yield</th>
                    <th className="px-4 py-3 text-right font-medium">Profit</th>
                    <th className="px-4 py-3 text-right font-medium">Cote moy.</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map(({ month, label, stats }) => {
                    const yc = stats.yield >= 0 ? 'text-emerald-400' : 'text-red-400'
                    return (
                      <tr key={month} className="border-t border-gray-800">
                        <td className="px-4 py-3 font-medium text-white capitalize">{label}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{stats.n}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{stats.winRate.toFixed(1)} %</td>
                        <td className={`px-4 py-3 text-right font-semibold ${yc}`}>{fmtPct(stats.yield)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${yc}`}>{fmtUnits(stats.profitUnits)}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{stats.avgOdds.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-2">Tous niveaux de confiance confondus (fort · modéré · à surveiller), hors Tennis.</p>
          </section>
        )}

        {/* Par sport */}
        {Object.entries(sports).map(([sport, entries]) => {
          const levels = [...new Set(entries.map(e => e.confiance).filter(Boolean))] as NonNullable<TrackEntry['confiance']>[]
          return (
          <section key={sport} className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 flex-wrap">
              <span><span className="mr-2">{SPORT_ICONS[sport] ?? '•'}</span>{sport}</span>
              {levels.map(l => <ForceBadge key={l} c={l} />)}
            </h2>
            <div className="mb-4">
              <StatsGrid stats={computeStats(entries)} />
            </div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Par niveau de confiance</h3>
            <ConfidenceBreakdown entries={entries} />
            <BetsByConfidence entries={entries} />
          </section>
          )
        })}

        {/* Props joueurs CdM — en construction */}
        <section className="mb-10">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <h2 className="text-xl font-bold">🎯 Props joueurs CdM</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">🚧 en construction</span>
          </div>
          {propStats.total > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {propStats.markets.map(m => (
                  <div key={m.market} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                    <p className="text-sm text-gray-400 mb-1">{m.label}</p>
                    <p className="text-2xl font-bold text-white">{m.winRate} %</p>
                    <p className="text-xs text-gray-500 mt-1">réussite · {m.n} pari{m.n > 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Taux de réussite des props (buteur, tirs cadrés, cartons, passes déc.), soldés sur les stats joueurs réelles.
                Échantillon en cours de constitution — le yield sera publié quand il sera représentatif.
              </p>
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <p className="text-sm text-gray-400">
                On accumule les résultats des props joueurs (buteur, tirs cadrés, cartons, passeurs).
                Les premiers chiffres apparaîtront ici dès que des matchs suivis seront terminés.
              </p>
            </div>
          )}
        </section>

        {tennisCount > 0 && (
          <section className="mb-10">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1">🎾 Tennis — track record en construction 🚧</h2>
                <p className="text-sm text-gray-400 max-w-2xl">
                  On accumule actuellement les données sur le tennis ({tennisCount} paris suivis). L&apos;échantillon est encore
                  trop court — et à variance élevée — pour communiquer un rendement représentatif. Par souci de transparence,
                  on publiera les chiffres tennis seulement quand ils seront solides. Les <span className="text-gray-300">signaux tennis restent disponibles</span> dès aujourd&apos;hui.
                </p>
              </div>
              <Link href="/signaux?tab=tennis" className="shrink-0 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                Voir les signaux tennis →
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
