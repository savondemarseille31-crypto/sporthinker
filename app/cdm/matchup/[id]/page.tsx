import Link from 'next/link'
import Header from '@/components/Header'
import { notFound } from 'next/navigation'
import { getEntitlement } from '@/lib/entitlement'
import { PaywallPage } from '@/components/PremiumLock'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { CDM_TEAM_PROFILES } from '@/lib/cdm-teams'
import { getTopPlayerSignals, type PlayerSignal } from '@/lib/cdm-player-signals'
import { generateCdMSignalsForMatch } from '@/lib/football-signals'
import type { Signal, SignalForce } from '@/lib/signals'

export async function generateStaticParams() {
  return CDM_FIXTURES.map(f => ({ id: String(f.id) }))
}

// ── Helpers visuels ──────────────────────────────────────────────────────────

function forceConfig(force: SignalForce, tier?: Signal['tier']) {
  if (tier === 'value') {
    const colors = { fort: 'bg-emerald-500/30 text-emerald-300 border-emerald-400', modéré: 'bg-blue-500/20 text-blue-300 border-blue-400', 'à surveiller': 'bg-indigo-500/20 text-indigo-300 border-indigo-500' }
    return { dot: 'bg-emerald-400', badge: `${colors[force]} border`, label: '💰 Value' }
  }
  switch (force) {
    case 'fort':         return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré':       return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',   label: '🔶 Modéré' }
    case 'à surveiller': return { dot: 'bg-gray-400',    badge: 'bg-gray-700 text-gray-400 border border-gray-600',               label: '👁 Modèle' }
  }
}

function typeColor(typePari: string) {
  if (typePari.includes('Under'))  return 'text-blue-400'
  if (typePari.includes('Over'))   return 'text-orange-400'
  if (typePari.includes('1x2'))    return 'text-emerald-400'
  if (typePari.includes('BTTS'))   return 'text-pink-400'
  return 'text-white'
}

const MARCHÉ_COLOR: Record<string, string> = {
  buteur: 'text-emerald-400',
  'tirs-cadrés': 'text-blue-400',
  passeur: 'text-purple-400',
  'carton-jaune': 'text-yellow-400',
}

// ── Composants ───────────────────────────────────────────────────────────────

function MatchSignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force, signal.tier)
  const isValue = signal.tier === 'value'
  return (
    <div className={`bg-gray-900 rounded-2xl p-4 border ${isValue ? 'border-emerald-500/40' : 'border-gray-800'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
          {isValue && signal.ev ? `💰 Value +${signal.ev}%` : cfg.label}
        </span>
        <span className={`text-xs font-medium ${typeColor(signal.typePari)}`}>{signal.typePari}</span>
      </div>
      <p className="font-bold text-white text-base mb-1">{signal.pari}</p>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">{signal.raisonnement}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {signal.stats.map((s, i) => (
          <div key={i} className={`rounded-lg px-2 py-1.5 text-center ${s.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.val}</p>
            <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      <Link href="/paris/calculateur" className="mt-3 block text-center text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
        Calculer la value →
      </Link>
    </div>
  )
}

function PlayerRow({ signal }: { signal: PlayerSignal }) {
  const color = MARCHÉ_COLOR[signal.marché] ?? 'text-white'
  return (
    <Link
      href={`/cdm/joueurs/${signal.playerId}`}
      className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 hover:border-gray-600 transition-colors group"
    >
      <span className="text-base shrink-0">{signal.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{signal.playerName}</p>
        <p className="text-xs text-gray-500 truncate">{signal.poste} · {signal.club}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${color}`}>{signal.valeurClé}</p>
        <p className="text-xs text-gray-600">{signal.marchéLabel}</p>
      </div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CdmMatchupPage({ params }: { params: Promise<{ id: string }> }) {
  const { premium } = await getEntitlement()
  if (!premium) return <PaywallPage title="Analyse du match réservée aux abonnés" />
  const { id } = await params
  const match = CDM_FIXTURES.find(f => f.id === Number(id))
  if (!match) notFound()

  const homeProfile = CDM_TEAM_PROFILES.find(t => t.pays === match.domicile)
  const awayProfile = CDM_TEAM_PROFILES.find(t => t.pays === match.exterieur)

  const homeSignals = getTopPlayerSignals({ pays: match.domicile, n: 4, forceMin: 'modéré' })
  const awaySignals = getTopPlayerSignals({ pays: match.exterieur, n: 4, forceMin: 'modéré' })

  const matchSignals = generateCdMSignalsForMatch({
    id: match.id,
    date: match.date,
    heure: match.heure,
    domicile: match.domicile,
    exterieur: match.exterieur,
  })

  const dateStr = new Date(`${match.date}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />
      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/cdm" className="hover:text-emerald-400 transition-colors">CdM 2026</Link>
          <span>›</span>
          <Link href="/cdm/calendrier" className="hover:text-emerald-400 transition-colors">Calendrier</Link>
          <span>›</span>
          <span className="text-gray-300">{match.domicile} vs {match.exterieur}</span>
        </div>

        {/* Header match */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              Groupe {match.groupe}
            </span>
            <span className="text-xs text-gray-400 capitalize">{dateStr}</span>
            <span className="text-xs text-gray-500">· {match.heure} (Paris)</span>
            <span className="text-xs text-gray-600">📍 {match.stade}</span>
          </div>
          <div className="grid grid-cols-[1fr_56px_1fr] items-center">
            <div className="text-center">
              <p className="text-5xl md:text-6xl mb-3">{match.flagD}</p>
              <p className="text-lg md:text-xl font-bold">{match.domicile}</p>
              {homeProfile && (
                <p className="text-xs text-gray-500 mt-1">
                  #{homeProfile.classementFIFA} FIFA · {homeProfile.formation}
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">VS</p>
            </div>
            <div className="text-center">
              <p className="text-5xl md:text-6xl mb-3">{match.flagE}</p>
              <p className="text-lg md:text-xl font-bold">{match.exterieur}</p>
              {awayProfile && (
                <p className="text-xs text-gray-500 mt-1">
                  #{awayProfile.classementFIFA} FIFA · {awayProfile.formation}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Signaux match */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">⚡ Signal match</h2>
          {matchSignals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchSignals.map(s => <MatchSignalCard key={s.id} signal={s} />)}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
              <p className="text-gray-500 text-sm">Aucun signal match détecté — les deux équipes sont trop proches en termes de valeurs xG estimées.</p>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-3">Signaux basés sur les classements FIFA (estimation pré-tournoi).</p>
        </section>

        {/* Joueurs à surveiller */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">👤 Joueurs à surveiller</h2>
            <Link href="/cdm/signaux" className="text-sm text-gray-500 hover:text-emerald-400 transition-colors">
              Tous les signaux →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-3">{match.flagD} {match.domicile}</p>
              <div className="space-y-2">
                {homeSignals.length > 0
                  ? homeSignals.map(s => <PlayerRow key={`${s.playerId}-${s.marché}`} signal={s} />)
                  : <p className="text-sm text-gray-500 py-4 text-center">Aucun signal disponible.</p>
                }
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-3">{match.flagE} {match.exterieur}</p>
              <div className="space-y-2">
                {awaySignals.length > 0
                  ? awaySignals.map(s => <PlayerRow key={`${s.playerId}-${s.marché}`} signal={s} />)
                  : <p className="text-sm text-gray-500 py-4 text-center">Aucun signal disponible.</p>
                }
              </div>
            </div>
          </div>
        </section>

        {/* Profils équipes */}
        {(homeProfile || awayProfile) && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">🎯 Profils équipes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { profile: homeProfile, flag: match.flagD },
                { profile: awayProfile, flag: match.flagE },
              ].map(({ profile, flag }) => profile ? (
                <div key={profile.pays} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{flag}</span>
                    <div>
                      <p className="font-bold text-white">{profile.pays}</p>
                      <p className="text-xs text-gray-500">
                        {profile.selectionneur} · {profile.formation} · #{profile.classementFIFA} FIFA
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wide">Points forts</p>
                    <ul className="space-y-1.5">
                      {profile.pointsForts.map((p, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Points faibles</p>
                    <ul className="space-y-1.5">
                      {profile.pointsFaibles.map((p, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-3">{profile.ambitions}</p>
                  <Link
                    href={`/cdm/equipes/${profile.slug}`}
                    className="block text-center text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Voir la fiche équipe →
                  </Link>
                </div>
              ) : null)}
            </div>
          </section>
        )}

        {/* CTA bas de page */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">⚡ Tous les signaux props joueurs</p>
            <p className="text-sm text-gray-400">Buteur, tirs cadrés, passeur, carton jaune — tous les marchés.</p>
          </div>
          <Link
            href="/cdm/signaux"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            Voir →
          </Link>
        </div>

      </div>
    </main>
  )
}
