import Header from '@/components/Header'

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1">🔐 Admin</h1>
            <p className="text-gray-400">Zone privée — configuration et intégrations</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Stake */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
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
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs text-gray-600">
              Accès réservé aux comptes administrateurs · session gérée par Supabase (déconnexion via le menu en haut à droite).
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
