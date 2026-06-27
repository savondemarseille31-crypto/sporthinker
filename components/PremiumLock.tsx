import Link from 'next/link'
import Header from './Header'

type Force = 'fort' | 'modéré' | 'à surveiller'

const FORCE: Record<Force, { dot: string; badge: string; label: string }> = {
  fort:           { dot: 'bg-violet-400', badge: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', label: '⚡ Fort' },
  'modéré':       { dot: 'bg-yellow-400',  badge: 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30',  label: '🔶 Modéré' },
  'à surveiller': { dot: 'bg-gray-400',    badge: 'bg-gray-700       text-gray-400    border border-gray-600',       label: '👁 À surveiller' },
}

// Carte verrouillée : on affiche éventuellement le badge de force + sport (aguiche),
// mais AUCUNE donnée du pari (match, pari, cote) n'est rendue — placeholders en dur.
export function LockedSignalCard({ force, sportLabel }: { force?: Force; sportLabel?: string }) {
  const cfg = force ? FORCE[force] : null
  return (
    <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-5 flex flex-col gap-4">
      {(cfg || sportLabel) && (
        <div className="flex items-center gap-2 flex-wrap">
          {cfg && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`} />
              {cfg.label}
            </span>
          )}
          {sportLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{sportLabel}</span>
          )}
        </div>
      )}
      <div className="blur-sm select-none pointer-events-none" aria-hidden>
        <p className="text-sm text-gray-400 mb-1">██████████ vs ██████████</p>
        <div className="mt-2 bg-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Pari recommandé</p>
          <p className="text-base font-bold text-white">████████████████</p>
          <p className="text-xs text-gray-500 mt-0.5">Cote ████</p>
        </div>
        <p className="text-sm text-gray-500 mt-3">████████████████████████████████████</p>
      </div>
      <Link
        href="/abonnement"
        className="mt-auto flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-400 text-black text-sm font-bold py-2.5 rounded-xl transition-colors"
      >
        🔒 Débloquer avec Premium
      </Link>
    </div>
  )
}

// Bandeau d'incitation en tête des pages de listes (non-premium).
export function PaywallNotice({ count }: { count?: number }) {
  return (
    <div className="mb-8 bg-violet-500/10 border border-violet-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="font-bold text-white mb-1">🔒 {count ? `${count} signaux ` : ''}réservés aux abonnés Premium</p>
        <p className="text-sm text-gray-400">Débloque tous les paris recommandés, cotes et values avec Premium.</p>
      </div>
      <Link
        href="/abonnement"
        className="shrink-0 bg-violet-500 hover:bg-violet-400 text-black font-bold px-5 py-3 rounded-xl text-sm transition-colors text-center"
      >
        Passe Premium →
      </Link>
    </div>
  )
}

// Page complète de paywall (pour les pages d'analyse détaillée) — chrome inclus.
export function PaywallPage({ title }: { title?: string }) {
  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-10 text-center max-w-xl mx-auto my-10">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">{title ?? 'Analyse réservée aux abonnés'}</h2>
          <p className="text-gray-400 mb-6">
            Cette page fait partie du contenu Premium : paris recommandés, cotes, value (EV) et analyse détaillée.
          </p>
          <Link
            href="/abonnement"
            className="inline-block bg-violet-500 hover:bg-violet-400 text-black font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Passe Premium →
          </Link>
        </div>
      </div>
    </main>
  )
}
