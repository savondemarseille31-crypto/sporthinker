'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import type { PlayerSignal, PlayerSignalForce, PlayerMarket } from '@/lib/cdm-player-signals'
import { saveTrackedSignalRaw, isAlreadyTracked } from '@/lib/signal-tracker'

// ── Types ────────────────────────────────────────────────────────────────────

type DateFilter = 'Aujourd\'hui' | 'Demain' | 'Tous'

type SignalsByMarket = {
  buteurs:    PlayerSignal[]
  tirsCadrés: PlayerSignal[]
  cartons:    PlayerSignal[]
  passeurs:   PlayerSignal[]
}

// ── Helpers visuels ──────────────────────────────────────────────────────────

function forceConfig(force: PlayerSignalForce) {
  switch (force) {
    case 'fort':   return { dot: 'bg-violet-400', badge: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', label: '⚡ Fort' }
    case 'modéré': return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',   label: '🔶 Modéré' }
    default:       return { dot: 'bg-gray-400',    badge: 'bg-gray-700 text-gray-400 border border-gray-600',               label: 'Faible' }
  }
}

function confianceLabel(c: PlayerSignal['confiance']) {
  switch (c) {
    case 'haute':   return { text: 'text-violet-400', label: '● Haute confiance' }
    case 'moyenne': return { text: 'text-yellow-400',  label: '● Confiance moyenne' }
    default:        return { text: 'text-gray-500',    label: '● Petit échantillon' }
  }
}

function marketColor(marché: PlayerMarket) {
  switch (marché) {
    case 'buteur':       return 'text-violet-400'
    case 'tirs-cadrés':  return 'text-blue-400'
    case 'tirs-tentés':  return 'text-cyan-400'
    case 'carton-jaune': return 'text-yellow-400'
    case 'passeur':      return 'text-purple-400'
  }
}

// ── Carte signal joueur ───────────────────────────────────────────────────────

function getNextFixture(pays: string) {
  const today = new Date().toISOString().slice(0, 10)
  return CDM_FIXTURES.find(f =>
    f.date >= today && (f.domicile === pays || f.exterieur === pays)
  ) ?? null
}

function PlayerSignalCard({ signal }: { signal: PlayerSignal }) {
  const cfg      = forceConfig(signal.force)
  const conf     = confianceLabel(signal.confiance)
  const fixture  = getNextFixture(signal.pays)
  const signalId = `cdm-${signal.playerId}-${signal.marché}`
  const date     = fixture?.date ?? new Date().toISOString().slice(0, 10)
  const [saved, setSaved] = useState(() => isAlreadyTracked(signalId, date))
  const [toast, setToast] = useState(false)

  function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (saved || !fixture) return
    const matchStr = `${fixture.domicile} vs ${fixture.exterieur}`
    saveTrackedSignalRaw({
      signalId,
      date,
      sport: 'CdM',
      match: matchStr,
      pari: `${signal.playerName} — ${signal.marchéLabel}`,
      typePari: signal.marché,
      // PlayerSignalForce a 'faible' là où SignalForce a 'à surveiller'
      force: signal.force === 'faible' ? 'à surveiller' : signal.force,
      cote: signal.cote ?? 2.0,
      statut: 'en_cours',
      marché: signal.marché,
    })
    setSaved(true)
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  return (
    <div className="relative bg-[#14171f] border border-[#262b36] rounded-2xl p-4 hover:border-gray-600 transition-colors">
      {/* Toast */}
      {toast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-violet-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          ✓ Signal enregistré
        </div>
      )}

      <Link href={`/cdm/joueurs/${signal.playerId}`} className="block group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
              {cfg.label}
            </span>
            <span className={`text-xs font-medium ${marketColor(signal.marché)}`}>
              {signal.marchéLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {signal.cote && signal.probEstimee != null && (() => {
              const ev  = (signal.probEstimee * signal.cote - 1) * 100
              const pos = ev >= 0
              return (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                  pos
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  EV {pos ? '+' : ''}{ev.toFixed(1)}%
                </span>
              )
            })()}
            {signal.cote && (
              <span className="text-xs bg-gray-800 border border-gray-700 text-white font-bold px-2 py-0.5 rounded-lg">
                Cote {signal.cote.toFixed(2)}
              </span>
            )}
            <span className="text-lg">{signal.flag}</span>
          </div>
        </div>

        <div className="mb-2">
          <p className="font-bold text-white text-base group-hover:text-violet-400 transition-colors">
            {signal.playerName}
          </p>
          <p className="text-xs text-gray-500">{signal.poste} · {signal.club}</p>
        </div>

        <div className="bg-gray-800 rounded-xl px-3 py-2 mb-3">
          <p className={`text-lg font-bold ${marketColor(signal.marché)}`}>{signal.valeurClé}</p>
          <p className="text-xs text-gray-500">{signal.seuil}</p>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed mb-3">{signal.raisonnement}</p>

        <div className="grid grid-cols-2 gap-1.5">
          {signal.stats.map((s, i) => (
            <div key={i} className={`rounded-lg px-2 py-1.5 text-center ${s.highlight ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-gray-800'}`}>
              <p className={`text-sm font-bold ${s.highlight ? 'text-violet-400' : 'text-white'}`}>{s.val}</p>
              <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <div className={`mt-3 text-xs ${conf.text}`}>{conf.label}</div>
      </Link>

      {/* Bouton enregistrer */}
      <button
        onClick={handleSave}
        disabled={saved || !fixture}
        className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
          saved
            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 cursor-default'
            : !fixture
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-gray-800 hover:bg-violet-500/20 hover:text-violet-400 text-gray-400 border border-gray-700 hover:border-violet-500/30'
        }`}
      >
        {saved ? '✓ Dans le suivi' : !fixture ? 'Pas de match prévu' : '+ Suivre ce signal'}
      </button>
    </div>
  )
}

// ── Section marché (vue "Tous") ────────────────────────────────────────────────

function MarketSection({
  title, signals, accentClass, emptyMsg,
}: {
  title: string
  signals: PlayerSignal[]
  accentClass: string
  emptyMsg: string
}) {
  const forts = signals.filter(s => s.force === 'fort').length
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className={`text-xl font-bold ${accentClass}`}>{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
          {signals.length} signal{signals.length > 1 ? 's' : ''}
        </span>
        {forts > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
            {forts} ⚡ fort{forts > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {signals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {signals.map(s => <PlayerSignalCard key={`${s.playerId}-${s.marché}`} signal={s} />)}
        </div>
      ) : (
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 text-center">
          <p className="text-gray-500 text-sm">{emptyMsg}</p>
        </div>
      )}
    </section>
  )
}

// ── Section match (vue Aujourd'hui / Demain) ──────────────────────────────────

function MatchSection({
  fixture,
  signals,
}: {
  fixture: (typeof CDM_FIXTURES)[number]
  signals: PlayerSignal[]
}) {
  if (!signals.length) return null
  const fortCount = signals.filter(s => s.force === 'fort').length

  return (
    <section className="mb-10">
      {/* En-tête match */}
      <Link
        href={`/cdm/matchup/${fixture.id}`}
        className="flex items-center gap-3 mb-4 group"
      >
        <div className="flex-1 bg-[#14171f] border border-[#262b36] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-violet-500 transition-colors">
          <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full shrink-0">
            Gr. {fixture.groupe}
          </span>
          <span className="text-xs text-violet-400 font-medium shrink-0">{fixture.heure}</span>
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            <span>{fixture.flagD}</span>
            <span className="font-semibold text-white group-hover:text-violet-400 transition-colors truncate text-sm">
              {fixture.domicile}
            </span>
            <span className="text-gray-500 text-xs">vs</span>
            <span className="font-semibold text-white group-hover:text-violet-400 transition-colors truncate text-sm">
              {fixture.exterieur}
            </span>
            <span>{fixture.flagE}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fortCount > 0 && (
              <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                {fortCount} ⚡
              </span>
            )}
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {signals.length} signal{signals.length > 1 ? 's' : ''}
            </span>
            <span className="text-gray-600 text-xs group-hover:text-gray-400">Analyse →</span>
          </div>
        </div>
      </Link>

      {/* Signaux du match */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {signals.map(s => (
          <PlayerSignalCard key={`${s.playerId}-${s.marché}`} signal={s} />
        ))}
      </div>
    </section>
  )
}

// ── Vue groupée par match ─────────────────────────────────────────────────────

function ByMatchView({
  targetDate,
  all,
}: {
  targetDate: string
  all: PlayerSignal[]
}) {
  const fixtures = CDM_FIXTURES.filter(f => f.date === targetDate)

  if (!fixtures.length) {
    return (
      <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-8 text-center">
        <p className="text-gray-400 text-base mb-1">Aucun match ce jour</p>
        <p className="text-gray-600 text-sm">La compétition débute le 11 juin 2026.</p>
      </div>
    )
  }

  const hasAny = fixtures.some(f =>
    all.some(s => s.pays === f.domicile || s.pays === f.exterieur)
  )

  if (!hasAny) {
    return (
      <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-8 text-center">
        <p className="text-gray-400 text-sm">Aucun signal joueur pour les {fixtures.length} matchs de ce jour.</p>
      </div>
    )
  }

  return (
    <>
      {fixtures.map(f => {
        const sigs = all.filter(s => s.pays === f.domicile || s.pays === f.exterieur)
        return <MatchSection key={f.id} fixture={f} signals={sigs} />
      })}
    </>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function CdmSignauxClient({ signals }: { signals: SignalsByMarket }) {
  const [filter, setFilter] = useState<DateFilter>('Tous')

  const today    = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const matchesToday    = CDM_FIXTURES.filter(f => f.date === today).length
  const matchesTomorrow = CDM_FIXTURES.filter(f => f.date === tomorrow).length

  // Pool complet de tous les signaux (pour la vue date)
  const allSignals = [
    ...signals.buteurs,
    ...signals.tirsCadrés,
    ...signals.cartons,
    ...signals.passeurs,
  ]

  return (
    <div>
      {/* Filtres */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(['Aujourd\'hui', 'Demain', 'Tous'] as DateFilter[]).map(f => {
          const count = f === 'Aujourd\'hui' ? matchesToday : f === 'Demain' ? matchesTomorrow : null
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-violet-500 text-black'
                  : 'bg-[#14171f] border border-[#262b36] text-gray-400 hover:border-violet-500'
              }`}
            >
              {f}
              {count !== null && count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${filter === f ? 'bg-black/20' : 'bg-gray-700'}`}>
                  {count} matchs
                </span>
              )}
              {count !== null && count === 0 && (
                <span className={`text-xs ${filter === f ? 'opacity-60' : 'text-gray-600'}`}>—</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Vue "Aujourd'hui" / "Demain" — groupée par match */}
      {filter !== 'Tous' && (
        <ByMatchView
          targetDate={filter === 'Aujourd\'hui' ? today : tomorrow}
          all={allSignals}
        />
      )}

      {/* Vue "Tous" — groupée par marché */}
      {filter === 'Tous' && (
        <>
          <MarketSection title="⚽ Buteur du match"    signals={signals.buteurs.slice(0, 8)}    accentClass="text-violet-300" emptyMsg="Aucun signal sur ce marché." />
          <MarketSection title="🎯 Tirs cadrés (≥ 1)" signals={signals.tirsCadrés.slice(0, 8)} accentClass="text-blue-300"    emptyMsg="Aucun signal sur ce marché." />
          <MarketSection title="🎯 Passeur décisif"   signals={signals.passeurs.slice(0, 8)}   accentClass="text-purple-300"  emptyMsg="Aucun signal sur ce marché." />
          <MarketSection title="🟨 Carton jaune"      signals={signals.cartons.slice(0, 8)}    accentClass="text-yellow-300"  emptyMsg="Aucun signal sur ce marché." />
        </>
      )}
    </div>
  )
}
