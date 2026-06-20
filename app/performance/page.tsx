import Link from 'next/link'
import Header from '@/components/Header'
import {
  getTrackRecord,
  computeStats,
  bySport,
  byConfidence,
  CONF_ORDER,
  type TrackEntry,
  type TrackStats,
} from '@/lib/track-record'
import { getSelectionsTrackEntries } from '@/lib/track-record/selections'
import { getSignalHistoryTrackEntries } from '@/lib/track-record/signal-history'

export const dynamic = 'force-dynamic' // lit Supabase (sélections) — jamais prérendu au build

export const metadata = {
  title: 'Performance — track record public',
  description:
    'Track record 100 % public et vérifiable de SporThinker : tous les paris analysés, gagnants et perdants, en unités et yield.',
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

function StatsGrid({ stats }: { stats: TrackStats }) {
  const yieldColor = stats.yield >= 0 ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KpiCard label="Paris soldés" value={String(stats.n)} />
      <KpiCard label="Réussite" value={`${stats.winRate.toFixed(1)} %`} />
      <KpiCard label="Yield" value={fmtPct(stats.yield)} color={yieldColor} />
      <KpiCard label="Profit (unités)" value={fmtUnits(stats.profitUnits)} color={yieldColor} />
      <KpiCard label="Cote moyenne" value={stats.avgOdds.toFixed(2)} />
      <KpiCard
        label="Période"
        value={stats.periodStart && stats.periodEnd
          ? `${fmtDate(stats.periodStart)} → ${fmtDate(stats.periodEnd)}`
          : '—'}
      />
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
  const global = computeStats(published)
  const sports = bySport(published)

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
            SporThinker est un <span className="font-semibold">outil d&apos;analyse statistique</span>, n&apos;est pas un opérateur de jeux et ne prend aucun pari.
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

        {/* Stats globales */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Global</h2>
          <StatsGrid stats={global} />
        </section>

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
