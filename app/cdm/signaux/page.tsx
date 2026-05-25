import Link from 'next/link'
import Header from '@/components/Header'
import { getTopByMarket, type PlayerSignal, type PlayerSignalForce, type PlayerMarket } from '@/lib/cdm-player-signals'

export const revalidate = 3600

// =============================================
// HELPERS VISUELS
// =============================================

function forceConfig(force: PlayerSignalForce) {
  switch (force) {
    case 'fort':   return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: '⚡ Fort' }
    case 'modéré': return { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30',  label: '🔶 Modéré' }
    default:       return { dot: 'bg-gray-400',    badge: 'bg-gray-700       text-gray-400    border border-gray-600',       label: 'Faible' }
  }
}

function confianceLabel(c: PlayerSignal['confiance']) {
  switch (c) {
    case 'haute':   return { text: 'text-emerald-400', label: '● Haute confiance' }
    case 'moyenne': return { text: 'text-yellow-400',  label: '● Confiance moyenne' }
    default:        return { text: 'text-gray-500',    label: '● Petit échantillon' }
  }
}

function marketColor(marché: PlayerMarket) {
  switch (marché) {
    case 'buteur':       return 'text-emerald-400'
    case 'tirs-cadrés':  return 'text-blue-400'
    case 'tirs-tentés':  return 'text-cyan-400'
    case 'carton-jaune': return 'text-yellow-400'
    case 'passeur':      return 'text-purple-400'
  }
}

// =============================================
// CARTE SIGNAL JOUEUR
// =============================================

function PlayerSignalCard({ signal }: { signal: PlayerSignal }) {
  const cfg = forceConfig(signal.force)
  const conf = confianceLabel(signal.confiance)

  return (
    <Link
      href={`/cdm/joueurs/${signal.playerId}`}
      className="block bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-colors group"
    >
      {/* Header */}
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
        <span className="text-lg">{signal.flag}</span>
      </div>

      {/* Joueur */}
      <div className="mb-2">
        <p className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
          {signal.playerName}
        </p>
        <p className="text-xs text-gray-500">{signal.poste} · {signal.club}</p>
      </div>

      {/* Valeur clé */}
      <div className="bg-gray-800 rounded-xl px-3 py-2 mb-3">
        <p className={`text-lg font-bold ${marketColor(signal.marché)}`}>{signal.valeurClé}</p>
        <p className="text-xs text-gray-500">{signal.seuil}</p>
      </div>

      {/* Raisonnement */}
      <p className="text-xs text-gray-400 leading-relaxed mb-3">{signal.raisonnement}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5">
        {signal.stats.map((s, i) => (
          <div key={i} className={`rounded-lg px-2 py-1.5 text-center ${s.highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-800'}`}>
            <p className={`text-sm font-bold ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>{s.val}</p>
            <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Confiance */}
      <div className={`mt-3 text-xs ${conf.text}`}>{conf.label}</div>
    </Link>
  )
}

// =============================================
// SECTION DE MARCHÉ
// =============================================

function MarketSection({
  title,
  marché,
  signals,
  accentClass,
}: {
  title: string
  marché: PlayerMarket
  signals: PlayerSignal[]
  accentClass: string
}) {
  const forts = signals.filter(s => s.force === 'fort').length
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className={`text-xl font-bold ${accentClass}`}>{title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400`}>
          {signals.length} signal{signals.length > 1 ? 's' : ''}
        </span>
        {forts > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
            {forts} ⚡ fort{forts > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {signals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {signals.map(s => <PlayerSignalCard key={`${s.playerId}-${s.marché}`} signal={s} />)}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-gray-500 text-sm">Aucun signal sur ce marché.</p>
        </div>
      )}
    </section>
  )
}

// =============================================
// PAGE
// =============================================

export default function CdmSignauxPage() {
  const buteurs       = getTopByMarket('buteur', 8)
  const tirsCadrés    = getTopByMarket('tirs-cadrés', 8)
  const cartons       = getTopByMarket('carton-jaune', 8)
  const passeurs      = getTopByMarket('passeur', 8)

  const totalSignals  = buteurs.length + tirsCadrés.length + cartons.length + passeurs.length
  const totalForts    = [...buteurs, ...tirsCadrés, ...cartons, ...passeurs].filter(s => s.force === 'fort').length

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-7xl mx-auto">

        {/* Titre */}
        <div className="mb-2">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← CdM 2026</Link>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">🌍 Signaux CdM 2026</h1>
          <p className="text-gray-400">
            Props joueurs — marchés buteur, tirs cadrés, cartons et passes décisives.
            Algorithmes basés sur les stats de saison 2024-25.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalSignals}</p>
            <p className="text-xs text-gray-500 mt-1">Signaux actifs</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{totalForts}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Forts</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{buteurs.filter(s => s.force === 'fort').length}</p>
            <p className="text-xs text-gray-500 mt-1">⚽ Buteurs forts</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{cartons.filter(s => s.force === 'fort').length}</p>
            <p className="text-xs text-gray-500 mt-1">🟨 Cartons à risque</p>
          </div>
        </div>

        {/* Avertissement source données */}
        <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300 flex gap-3 items-start">
          <span className="text-lg mt-0.5 shrink-0">ℹ️</span>
          <div>
            <p className="font-semibold mb-1">Source des données</p>
            <p className="text-blue-400/80">
              Signaux calculés sur les stats de <span className="text-white font-medium">club (saison 2024-25)</span> pour les 17 équipes intégrées.
              Une fois la compétition lancée (11 juin), les stats seront enrichies avec les données temps réel API-Football
              (league 1, saison 2026). La confiance est proportionnelle au nombre de matchs joués.
            </p>
          </div>
        </div>

        {/* Seuils de référence */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '⚽ Buteur fort', val: '≥ 0.40 xG/match' },
            { label: '🎯 Cadré fort', val: '≥ 1.40/match' },
            { label: '🟨 Carton élevé', val: '≥ 22% des matchs' },
            { label: '🎯 Passeur fort', val: '≥ 0.33 xA/match' },
          ].map(t => (
            <div key={t.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">{t.label}</p>
              <p className="text-sm font-bold text-white">{t.val}</p>
            </div>
          ))}
        </div>

        {/* BUTEURS */}
        <MarketSection
          title="⚽ Buteur du match"
          marché="buteur"
          signals={buteurs}
          accentClass="text-emerald-300"
        />

        {/* TIRS CADRÉS */}
        <MarketSection
          title="🎯 Tirs cadrés (≥ 1)"
          marché="tirs-cadrés"
          signals={tirsCadrés}
          accentClass="text-blue-300"
        />

        {/* PASSEURS */}
        <MarketSection
          title="🎯 Passeur décisif"
          marché="passeur"
          signals={passeurs}
          accentClass="text-purple-300"
        />

        {/* CARTONS */}
        <MarketSection
          title="🟨 Carton jaune"
          marché="carton-jaune"
          signals={cartons}
          accentClass="text-yellow-300"
        />

        {/* Lien signaux généraux */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">⚡ Signaux matchs (Équipes)</p>
            <p className="text-sm text-gray-400">Moneyline, Over/Under, BTTS — basés sur les données API-Football temps réel.</p>
          </div>
          <Link href="/signaux"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 rounded-xl transition-colors text-sm">
            Voir →
          </Link>
        </div>
      </div>
    </main>
  )
}
