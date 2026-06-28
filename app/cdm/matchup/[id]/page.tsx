import Link from 'next/link'
import Header from '@/components/Header'
import { notFound } from 'next/navigation'
import { getEntitlement } from '@/lib/entitlement'
import { PaywallPage } from '@/components/PremiumLock'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { CDM_TEAM_PROFILES } from '@/lib/cdm-teams'
import { getTopPlayerSignals, type PlayerSignal } from '@/lib/cdm-player-signals'
import { generateCdMSignalsForMatch } from '@/lib/football-signals'
import { getCdMOdds, findEvent, devigFromEvent } from '@/lib/odds-api'
import { getWcResults } from '@/lib/api-football'
import type { Signal, SignalForce } from '@/lib/signals'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateStaticParams() {
  return CDM_FIXTURES.map(f => ({ id: String(f.id) }))
}

// ── Normalisation noms/drapeaux pour les matchs de phase finale (API-Football) ──
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
const CANON: Record<string, string> = {}
const FLAG: Record<string, string> = {}
for (const f of CDM_FIXTURES) {
  CANON[normTeam(f.domicile)] = f.domicile; FLAG[normTeam(f.domicile)] = f.flagD
  CANON[normTeam(f.exterieur)] = f.exterieur; FLAG[normTeam(f.exterieur)] = f.flagE
}
const canonTeam = (n: string) => CANON[normTeam(n)] ?? n
const flagOf = (n: string) => FLAG[normTeam(n)] ?? '🏳️'
const ROUND_LABEL: Record<string, string> = {
  'Round of 32': '16es de finale', 'Round of 16': '8es de finale', 'Quarter-finals': 'Quarts de finale',
  'Semi-finals': 'Demi-finales', '3rd Place Final': 'Match pour la 3e place', 'Final': 'Finale',
}
const roundLabel = (r: string) => ROUND_LABEL[r] ?? r

// ── Helpers visuels ──────────────────────────────────────────────────────────

function forceConfig(force: SignalForce, tier?: Signal['tier']) {
  if (tier === 'value') {
    const colors = { fort: 'bg-violet-500/30 text-violet-300 border-violet-400', modéré: 'bg-blue-500/20 text-blue-300 border-blue-400', 'à surveiller': 'bg-indigo-500/20 text-indigo-300 border-indigo-500' }
    return { dot: 'bg-violet-400', badge: `${colors[force]} border`, label: '💰 Value' }
  }
  switch (force) {
    case 'fort':         return { dot: 'bg-violet-400', badge: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', label: '⚡ Fort' }
    case 'modéré':       return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',   label: '🔶 Modéré' }
    case 'à surveiller': return { dot: 'bg-gray-400',    badge: 'bg-gray-700 text-gray-400 border border-gray-600',               label: '👁 Modèle' }
  }
}

function typeColor(typePari: string) {
  if (typePari.includes('Under'))  return 'text-blue-400'
  if (typePari.includes('Over'))   return 'text-orange-400'
  if (typePari.includes('1x2'))    return 'text-violet-400'
  if (typePari.includes('BTTS'))   return 'text-pink-400'
  return 'text-white'
}

const MARCHÉ_COLOR: Record<string, string> = {
  buteur: 'text-violet-400',
  'tirs-cadrés': 'text-blue-400',
  passeur: 'text-purple-400',
  'carton-jaune': 'text-yellow-400',
}

// ── Composants ───────────────────────────────────────────────────────────────

function MatchSignalCard({ signal }: { signal: Signal }) {
  const cfg = forceConfig(signal.force, signal.tier)
  const isValue = signal.tier === 'value'
  return (
    <div className={`bg-[#14171f] rounded-2xl p-4 border ${isValue ? 'border-violet-500/40' : 'border-[#262b36]'}`}>
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
          <div key={i} className={`rounded-lg px-2 py-1.5 text-center ${s.highlight ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-violet-400' : 'text-white'}`}>{s.val}</p>
            <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      <Link href="/paris/calculateur" className="mt-3 block text-center text-xs text-violet-400 hover:text-violet-300 transition-colors">
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
      className="flex items-center gap-3 bg-[#14171f] border border-[#262b36] rounded-xl px-3 py-2.5 hover:border-gray-600 transition-colors group"
    >
      <span className="text-base shrink-0">{signal.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-violet-400 transition-colors">{signal.playerName}</p>
        <p className="text-xs text-gray-500 truncate">{signal.poste} · {signal.club}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${color}`}>{signal.valeurClé}</p>
        <p className="text-xs text-gray-600">{signal.marchéLabel}</p>
      </div>
    </Link>
  )
}

// Extrait un % depuis les stats d'un signal (val type "83%").
function pctFromStats(stats: { label: string; val: string }[], pred: (l: string) => boolean): number | null {
  const s = stats.find(x => pred(x.label.toLowerCase()))
  if (!s) return null
  const n = parseFloat(s.val.replace('%', '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Barre de probabilité 1x2 (dom / nul / ext) — viz sportive façon "win probability".
function ProbabilityBar({ signal, home, away }: { signal: Signal; home: string; away: string }) {
  const h = pctFromStats(signal.stats, l => l.includes(home.toLowerCase()))
  const d = pctFromStats(signal.stats, l => /nul|draw/.test(l))
  const a = pctFromStats(signal.stats, l => l.includes(away.toLowerCase()))
  if (h == null || d == null || a == null) return null
  const total = h + d + a || 1
  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-2">
        <span>📊 Probabilité du modèle</span>
        <span>Dixon-Coles</span>
      </div>
      <div className="flex h-3.5 rounded-full overflow-hidden bg-[#0a0d14] mb-2.5">
        <div style={{ width: `${(h / total) * 100}%` }} className="bg-violet-500" />
        <div style={{ width: `${(d / total) * 100}%` }} className="bg-gray-600" />
        <div style={{ width: `${(a / total) * 100}%` }} className="bg-sky-500" />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="min-w-0"><span className="text-2xl font-extrabold text-violet-400 tabular-nums">{h}%</span> <span className="text-sm text-gray-400 truncate">{home}</span></span>
        <span className="text-sm text-gray-500 shrink-0">{d}% nul</span>
        <span className="text-right min-w-0"><span className="text-sm text-gray-400 truncate">{away}</span> <span className="text-2xl font-extrabold text-sky-400 tabular-nums">{a}%</span></span>
      </div>
    </div>
  )
}

// Ligne de comparaison à barres opposées (valeur dom vs ext).
function CompareRow({ label, h, a, fmt = (v: number) => v.toFixed(2) }: { label: string; h: number; a: number; fmt?: (v: number) => string }) {
  const total = (h + a) || 1
  return (
    <div className="py-2.5 border-t border-[#262b36] first:border-t-0">
      <p className="text-center text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-12 text-right text-sm font-bold text-violet-400 tabular-nums">{fmt(h)}</span>
        <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[#0a0d14]">
          <div className="bg-violet-500" style={{ width: `${(h / total) * 100}%` }} />
          <div className="bg-sky-500" style={{ width: `${(a / total) * 100}%` }} />
        </div>
        <span className="w-12 text-sm font-bold text-sky-400 tabular-nums">{fmt(a)}</span>
      </div>
    </div>
  )
}

// Panneau "Face à face" — comble la colonne de droite du signal avec un comparatif visuel.
function MatchupCompare({ home, away, homeRank, awayRank, homeForm, awayForm, lambdaH, lambdaA }: {
  home: string; away: string
  homeRank?: number; awayRank?: number
  homeForm?: string; awayForm?: string
  lambdaH: number | null; lambdaA: number | null
}) {
  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-3">
        <span className="text-violet-400 font-semibold">{home}</span>
        <span>Face à face</span>
        <span className="text-sky-400 font-semibold">{away}</span>
      </div>
      {lambdaH != null && lambdaA != null && (
        <CompareRow label="Buts attendus (λ)" h={lambdaH} a={lambdaA} />
      )}
      <div className="py-2.5 border-t border-[#262b36] grid grid-cols-3 items-center text-sm">
        <span className="font-bold text-white text-left">#{homeRank ?? '—'}</span>
        <span className="text-center text-[11px] uppercase tracking-wider text-gray-500">FIFA</span>
        <span className="font-bold text-white text-right">#{awayRank ?? '—'}</span>
      </div>
      <div className="py-2.5 border-t border-[#262b36] grid grid-cols-3 items-center text-sm">
        <span className="font-bold text-white text-left">{homeForm ?? '—'}</span>
        <span className="text-center text-[11px] uppercase tracking-wider text-gray-500">Formation</span>
        <span className="font-bold text-white text-right">{awayForm ?? '—'}</span>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CdmMatchupPage({ params }: { params: Promise<{ id: string }> }) {
  const { premium } = await getEntitlement()
  if (!premium) return <PaywallPage title="Analyse du match réservée aux abonnés" />
  const { id } = await params
  const fixtureId = Number(id)
  const groupFixture = CDM_FIXTURES.find(f => f.id === fixtureId)
  const isKnockout = !groupFixture

  // Vue match unifiée : soit une fixture de poule (statique), soit un matchup de phase
  // finale (dynamique API-Football, id = id de la fixture API).
  let match: {
    id: number; date: string; heure: string
    domicile: string; exterieur: string
    flagD: string; flagE: string
    label: string; stade: string
  }
  if (groupFixture) {
    match = {
      id: groupFixture.id, date: groupFixture.date, heure: groupFixture.heure,
      domicile: groupFixture.domicile, exterieur: groupFixture.exterieur,
      flagD: groupFixture.flagD, flagE: groupFixture.flagE,
      label: `Groupe ${groupFixture.groupe}`, stade: groupFixture.stade,
    }
  } else {
    const api = await getWcResults().catch(() => [] as any[])
    const af = (api as any[]).find(f => f.fixture?.id === fixtureId)
    if (!af) notFound()
    const dt = new Date(af.fixture.date)
    match = {
      id: fixtureId,
      date: dt.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }),
      heure: dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }),
      domicile: canonTeam(af.teams.home.name), exterieur: canonTeam(af.teams.away.name),
      flagD: flagOf(af.teams.home.name), flagE: flagOf(af.teams.away.name),
      label: roundLabel(af.league.round), stade: af.fixture.venue?.name ?? '',
    }
  }

  const homeProfile = CDM_TEAM_PROFILES.find(t => t.pays === match.domicile)
  const awayProfile = CDM_TEAM_PROFILES.find(t => t.pays === match.exterieur)

  const homeSignals = getTopPlayerSignals({ pays: match.domicile, n: 4, forceMin: 'modéré' })
  const awaySignals = getTopPlayerSignals({ pays: match.exterieur, n: 4, forceMin: 'modéré' })

  // Cotes réelles (Pinnacle via The Odds API) → permet de classer en "value" si EV+,
  // exactement comme la liste /signaux (sinon le même match aurait 2 étiquettes).
  const cdmOdds = await getCdMOdds().catch(() => [] as import('@/lib/odds-api').OddsEvent[])
  const cdmEvent = cdmOdds.length ? findEvent(cdmOdds, match.domicile, match.exterieur) : null
  const matchSignals = generateCdMSignalsForMatch({
    id: match.id,
    date: match.date,
    heure: match.heure,
    domicile: match.domicile,
    exterieur: match.exterieur,
    devigged: cdmEvent ? devigFromEvent(cdmEvent, match.domicile, match.exterieur) : undefined,
  })

  const dateStr = new Date(`${match.date}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />
      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/cdm" className="hover:text-violet-400 transition-colors">CdM 2026</Link>
          <span>›</span>
          {isKnockout
            ? <Link href="/cdm/phases-finales" className="hover:text-violet-400 transition-colors">Phases finales</Link>
            : <Link href="/cdm/calendrier" className="hover:text-violet-400 transition-colors">Calendrier</Link>}
          <span>›</span>
          <span className="text-gray-300">{match.domicile} vs {match.exterieur}</span>
        </div>

        {/* Header match */}
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">
              {match.label}
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
              <p className="text-2xl font-bold text-violet-400">VS</p>
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
          <h2 className="text-xl font-bold text-violet-400 mb-4">⚡ Signal match</h2>
          {matchSignals.length > 0 ? (() => {
            const probSig = matchSignals.find(s => s.stats?.some(x => /nul|draw/.test(x.label.toLowerCase())))
            const lam = probSig?.stats.find(x => x.label.includes('λ'))?.val.split('/').map(v => parseFloat(v))
            const lambdaH = lam && Number.isFinite(lam[0]) ? lam[0] : null
            const lambdaA = lam && Number.isFinite(lam[1]) ? lam[1] : null
            return (
              <>
                {probSig && <ProbabilityBar signal={probSig} home={match.domicile} away={match.exterieur} />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchSignals.map(s => <MatchSignalCard key={s.id} signal={s} />)}
                  <MatchupCompare
                    home={match.domicile} away={match.exterieur}
                    homeRank={homeProfile?.classementFIFA} awayRank={awayProfile?.classementFIFA}
                    homeForm={homeProfile?.formation} awayForm={awayProfile?.formation}
                    lambdaH={lambdaH} lambdaA={lambdaA}
                  />
                </div>
              </>
            )
          })() : (
            <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 text-center">
              <p className="text-gray-500 text-sm">Aucun signal match détecté — les deux équipes sont trop proches en termes de valeurs xG estimées.</p>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-3">Signaux basés sur les classements FIFA (estimation pré-tournoi).</p>
        </section>

        {/* Joueurs à surveiller */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">👤 Joueurs à surveiller</h2>
            <Link href="/cdm/signaux" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">
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
                <div key={profile.pays} className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5">
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
                    <p className="text-xs font-semibold text-violet-400 mb-2 uppercase tracking-wide">Points forts</p>
                    <ul className="space-y-1.5">
                      {profile.pointsForts.map((p, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5 shrink-0">✓</span>
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
                    className="block text-center text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Voir la fiche équipe →
                  </Link>
                </div>
              ) : null)}
            </div>
          </section>
        )}

        {/* CTA bas de page */}
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">⚡ Tous les signaux props joueurs</p>
            <p className="text-sm text-gray-400">Buteur, tirs cadrés, passeur, carton jaune — tous les marchés.</p>
          </div>
          <Link
            href="/cdm/signaux"
            className="shrink-0 bg-violet-500 hover:bg-violet-400 text-black font-bold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            Voir →
          </Link>
        </div>

      </div>
    </main>
  )
}
