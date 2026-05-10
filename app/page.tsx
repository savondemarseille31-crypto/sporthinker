import Link from 'next/link'
import Header from '@/components/Header'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Analyse. <span className="text-emerald-400">Parie.</span> Gagne.
        </h1>
        <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
          Statistiques avancées, ValueBets et suivi de bankroll pour les paris sportifs intelligents.
        </p>
        <Link href="/cdm" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors">
          🌍 Dashboard Coupe du Monde 2026
        </Link>
      </section>

      {/* Cards */}
      <section className="px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Link href="/cdm" className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500 transition-colors">
          <div className="text-4xl mb-4">🌍</div>
          <h2 className="text-xl font-bold mb-2">Coupe du Monde 2026</h2>
          <p className="text-gray-400 text-sm">48 équipes, groupes, matchs, stats joueurs et ValueBets</p>
        </Link>
        <Link href="/nba" className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500 transition-colors">
          <div className="text-4xl mb-4">🏀</div>
          <h2 className="text-xl font-bold mb-2">NBA</h2>
          <p className="text-gray-400 text-sm">Stats équipes, profils joueurs et analyse des matchs</p>
        </Link>
        <Link href="/paris" className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500 transition-colors">
          <div className="text-4xl mb-4">💰</div>
          <h2 className="text-xl font-bold mb-2">Mes Paris</h2>
          <p className="text-gray-400 text-sm">Calculateur de value, historique et gestion de bankroll</p>
        </Link>
      </section>
    </main>
  )
}
