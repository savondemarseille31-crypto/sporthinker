import Link from 'next/link'
import Header from '@/components/Header'
import { getTrackRecord, computeStats } from '@/lib/track-record'

export default function Home() {
  const s = computeStats(getTrackRecord())

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 max-w-5xl mx-auto text-center">
        <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-6">
          📊 Track record 100 % public
        </span>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          L&apos;outil d&apos;aide à la décision<br className="hidden md:block" /> pour vos paris sportifs
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          Signaux quotidiens, value bets et calculateur de mise basés sur des modèles statistiques.
          Vous gardez le contrôle — <span className="text-gray-300">nos résultats sont publics et vérifiables</span>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/performance" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl transition-colors">
            Voir la performance →
          </Link>
          <Link href="/signaux" className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Les signaux du jour
          </Link>
        </div>
        <p className="text-xs text-gray-600 mt-6">18+ • Jouer comporte des risques • Aucune garantie de gain</p>
      </section>

      {/* Preuve — vraies stats */}
      <section className="px-6 py-10 max-w-5xl mx-auto">
        <Link href="/performance" className="block bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-2xl p-6 transition-colors">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-400">{s.yield >= 0 ? '+' : ''}{s.yield} %</p>
              <p className="text-xs text-gray-500 mt-1">Yield</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{s.winRate} %</p>
              <p className="text-xs text-gray-500 mt-1">Réussite</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{s.n}</p>
              <p className="text-xs text-gray-500 mt-1">Paris soldés</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">{s.profitUnits >= 0 ? '+' : ''}{s.profitUnits} u</p>
              <p className="text-xs text-gray-500 mt-1">Profit (unités)</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center mt-5">
            Signaux forts MLB · mise à plat · performances passées ≠ résultats futurs — <span className="text-emerald-400">voir le détail vérifiable →</span>
          </p>
        </Link>
      </section>

      {/* Comment ça marche */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Comment ça marche</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: '1', t: 'On analyse', d: 'Nos modèles statistiques (Dixon-Coles, Elo, xG) passent au crible les matchs du jour.' },
            { n: '2', t: 'On vous donne le signal', d: 'Pari recommandé, niveau de confiance, et la value (EV) face aux cotes du marché.' },
            { n: '3', t: 'Vous décidez', d: 'Vous gardez le contrôle : le calculateur Kelly vous aide à dimensionner votre mise.' },
          ].map(step => (
            <div key={step.n} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center mb-4">{step.n}</div>
              <h3 className="font-semibold text-white mb-1">{step.t}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { e: '⚡', t: 'Signaux quotidiens', d: 'Multi-sports : MLB, Coupe du Monde, Tennis, NBA, MLS.' },
            { e: '💰', t: 'Value bets (EV)', d: 'Les paris où le modèle estime un edge supérieur au marché.' },
            { e: '🧮', t: 'Calculateur Kelly', d: 'Dimensionnez votre mise selon votre bankroll. Vous gardez le contrôle.' },
            { e: '📊', t: 'Suivi & ROI', d: 'Suivez vos paris, votre rendement et votre CLV dans le temps.' },
          ].map(f => (
            <div key={f.t} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex gap-4">
              <span className="text-2xl">{f.e}</span>
              <div>
                <h3 className="font-semibold text-white mb-1">{f.t}</h3>
                <p className="text-sm text-gray-400">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="px-6 py-12 max-w-4xl mx-auto scroll-mt-20">
        <h2 className="text-2xl font-bold text-center mb-2">Tarifs</h2>
        <p className="text-sm text-gray-500 text-center mb-10">Commencez gratuitement. Sans engagement.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-1">Gratuit</h3>
            <p className="text-3xl font-bold mb-4">0 €</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>✓ Track record public complet</li>
              <li>✓ 1 signal gratuit par jour</li>
              <li>✓ Calculateur de value (Kelly)</li>
            </ul>
            <Link href="/signaux" className="block text-center bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
              Commencer gratuitement
            </Link>
          </div>
          <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl p-6 relative">
            <span className="absolute -top-3 left-6 text-xs font-semibold bg-emerald-500 text-black px-2 py-0.5 rounded-full">Recommandé</span>
            <h3 className="font-bold text-white mb-1">Premium</h3>
            <p className="text-3xl font-bold mb-1">24,90 € <span className="text-base font-normal text-gray-500">/ mois</span></p>
            <p className="text-xs text-gray-500 mb-4">ou 199 €/an · membres fondateurs : 9,99 €/mois à vie (offre limitée)</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>✓ Tous les signaux du jour, tous sports</li>
              <li>✓ Toutes les values (EV)</li>
              <li>✓ Suivi personnel synchronisé</li>
            </ul>
            <Link href="/signup?plan=premium" className="block text-center bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl transition-colors">
              Je m&apos;abonne
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
        <div className="space-y-3">
          {[
            { q: 'Garantissez-vous des gains ?', a: 'Non. Aucun outil ne peut garantir de gains. Nous fournissons des analyses statistiques et un track record transparent ; les performances passées ne préjugent pas des résultats futurs.' },
            { q: 'Est-ce un site de paris ?', a: 'Non. SporThinker est un outil d’analyse. Nous ne sommes pas un opérateur de jeux et ne prenons aucun pari.' },
            { q: 'Comment sont calculés les signaux ?', a: 'Via des modèles statistiques (Dixon-Coles, Elo, xG, FIP/ERA selon le sport) comparés aux cotes du marché pour identifier la value.' },
            { q: 'Puis-je résilier à tout moment ?', a: 'Oui. L’abonnement est sans engagement et résiliable depuis votre espace client.' },
          ].map(f => (
            <details key={f.q} className="group bg-gray-900 border border-gray-800 rounded-2xl">
              <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between font-medium text-white">
                {f.q}
                <span className="text-gray-500 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-3">Prêt à décider avec des données ?</h2>
        <p className="text-gray-400 mb-6">Commencez gratuitement — et vérifiez nos résultats vous-même.</p>
        <Link href="/performance" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-3 rounded-xl transition-colors">
          Voir la performance →
        </Link>
      </section>
    </main>
  )
}
