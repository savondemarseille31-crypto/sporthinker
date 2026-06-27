import Link from 'next/link'
import Header from '@/components/Header'
import { getRankings, type RankingEntry } from '@/lib/tennis-api'

export const revalidate = 3600 // 1h — classements ATP/WTA

// ── Helpers ───────────────────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  ITA: '🇮🇹', ESP: '🇪🇸', GER: '🇩🇪', SRB: '🇷🇸', CAN: '🇨🇦', USA: '🇺🇸',
  RUS: '🇷🇺', AUS: '🇦🇺', KAZ: '🇰🇿', FRA: '🇫🇷', GBR: '🇬🇧', POL: '🇵🇱',
  BLR: '🇧🇾', CZE: '🇨🇿', ROU: '🇷🇴', GRE: '🇬🇷', NOR: '🇳🇴', DEN: '🇩🇰',
  ARG: '🇦🇷', BRA: '🇧🇷', JPN: '🇯🇵', CHN: '🇨🇳', KOR: '🇰🇷', RSA: '🇿🇦',
  NED: '🇳🇱', BEL: '🇧🇪', SUI: '🇨🇭', AUT: '🇦🇹', CRO: '🇭🇷', SVK: '🇸🇰',
  HUN: '🇭🇺', TUN: '🇹🇳', MAR: '🇲🇦', UKR: '🇺🇦', GEO: '🇬🇪',
}

function countryFlag(acr: string): string {
  return FLAG[acr] ?? '🏳️'
}

function progressBadge(progress: number) {
  if (progress > 0)  return <span className="text-[10px] text-violet-400">▲{progress}</span>
  if (progress < 0)  return <span className="text-[10px] text-red-400">▼{Math.abs(progress)}</span>
  return <span className="text-[10px] text-gray-600">—</span>
}

function medalColor(pos: number): string {
  if (pos === 1) return 'text-yellow-400'
  if (pos === 2) return 'text-gray-300'
  if (pos === 3) return 'text-amber-600'
  return 'text-gray-500'
}

// ── Composant tableau ─────────────────────────────────────────────────────────

function RankingTable({ entries, label }: { entries: RankingEntry[]; label: string }) {
  if (!entries.length) {
    return (
      <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-8 text-center text-gray-500 text-sm">
        Classement {label} indisponible
      </div>
    )
  }

  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#262b36] flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{label}</h2>
        <span className="text-xs text-gray-500">Top {entries.length} · Live Race</span>
      </div>

      <div className="divide-y divide-gray-800">
        {entries.map((entry) => (
          <div key={entry.player.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/50 transition-colors">
            {/* Position */}
            <div className="w-8 text-center shrink-0">
              <span className={`text-sm font-bold ${medalColor(entry.position)}`}>
                {entry.position}
              </span>
            </div>

            {/* Flag + Nom */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{countryFlag(entry.player.countryAcr)}</span>
                <span className="font-semibold text-white text-sm truncate">{entry.player.name}</span>
                <span className="text-xs text-gray-600 shrink-0">{entry.player.countryAcr}</span>
              </div>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-white">
                {entry.points.toLocaleString('fr-FR')} <span className="text-xs text-gray-500 font-normal">pts</span>
              </p>
              <div className="flex justify-end mt-0.5">
                {progressBadge(entry.progress)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ClassementsPage() {
  const [atpRanking, wtaRanking] = await Promise.all([
    getRankings('atp').catch(() => [] as RankingEntry[]),
    getRankings('wta').catch(() => [] as RankingEntry[]),
  ])

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/tennis" className="hover:text-violet-400 transition-colors">🎾 Tennis</Link>
          <span>/</span>
          <span className="text-gray-300">Classements</span>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">🏆 Classements Tennis</h1>
          <p className="text-gray-400">ATP & WTA · Singles · Mis à jour toutes les heures</p>
        </div>

        {/* Note plan API */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300 flex gap-3 items-start">
          <span className="text-lg shrink-0">ℹ️</span>
          <p className="text-blue-400/80">
            Le plan API actuel retourne les <span className="text-white font-medium">11 premiers</span> joueurs.
            Pour le top 50+, un plan supérieur est nécessaire sur RapidAPI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RankingTable entries={atpRanking}  label="🎾 ATP — Singles" />
          <RankingTable entries={wtaRanking}  label="🎾 WTA — Singles" />
        </div>

        {/* Lien retour */}
        <div className="mt-8 text-center">
          <Link
            href="/tennis"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-violet-400 transition-colors"
          >
            ← Retour aux matchs du jour
          </Link>
        </div>
      </div>
    </main>
  )
}
