import Header from '@/components/Header'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1">🔐 Admin</h1>
            <p className="text-gray-400">Zone privée — configuration et intégrations</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Signaux MLB v2 — privé, en test */}
          <Link href="/mlb/v2" className="block bg-[#14171f] border border-[#262b36] rounded-2xl p-6 hover:border-violet-500 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚾</span>
              <div className="flex-1">
                <h2 className="font-bold text-lg flex items-center gap-2 flex-wrap">Signaux MLB v2 <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">privé · en test</span></h2>
                <p className="text-sm text-gray-400">Modèle Pythagoricien + Kelly. Mesuré séparément du v1 — la perf « MLB v2 » apparaît sur /performance (admin uniquement).</p>
              </div>
              <span className="text-violet-400 shrink-0">→</span>
            </div>
          </Link>

          {/* Stake */}
          <div className="bg-[#14171f] border border-[#262b36] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎰</span>
              <div className="flex-1">
                <h2 className="font-bold text-lg">Intégration Stake.bet</h2>
                <p className="text-sm text-gray-400">Cotes temps réel · Sync paris · Bankroll live</p>
              </div>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-semibold">
                Bientôt
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Connecte ta clé API Stake pour synchroniser tes paris automatiquement et afficher les cotes réelles sur tous les signaux.
            </p>
          </div>

          {/* Infos session */}
          <div className="bg-[#14171f]/50 border border-[#262b36] rounded-2xl p-5">
            <p className="text-xs text-gray-600">
              Accès réservé aux comptes administrateurs · session gérée par Supabase (déconnexion via le menu en haut à droite).
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
