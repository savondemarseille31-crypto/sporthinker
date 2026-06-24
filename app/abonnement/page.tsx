import Header from '@/components/Header'
import SubscribeButton from '@/components/SubscribeButton'

export const metadata = { title: 'Abonnement Premium' }

const btnClass = 'w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl transition-colors'

export default function AbonnementPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Passe Premium</h1>
        <p className="text-gray-400 mb-8">
          Débloque <span className="text-gray-200">tous les signaux</span>, toutes les <span className="text-gray-200">values</span> et ton suivi synchronisé.
        </p>

        {/* Prix à garder synchronisés avec les tarifs Stripe (STRIPE_PRICE_MONTHLY / _ANNUAL). */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
            <span className="self-start text-xs font-semibold bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">Sans engagement</span>
            <h2 className="font-bold mt-3 mb-1">Mensuel</h2>
            <p className="text-3xl font-bold mb-4">19,99 € <span className="text-base font-normal text-gray-500">/ mois</span></p>
            <SubscribeButton plan="monthly" className={`${btnClass} mt-auto`}>S&apos;abonner — mensuel</SubscribeButton>
          </div>
          <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl p-6 flex flex-col">
            <span className="self-start text-xs font-semibold bg-emerald-500 text-black px-2 py-0.5 rounded-full">2 mois offerts</span>
            <h2 className="font-bold mt-3 mb-1">Annuel</h2>
            <p className="text-3xl font-bold mb-4">199,90 € <span className="text-base font-normal text-gray-500">/ an</span></p>
            <SubscribeButton plan="annual" className={`${btnClass} mt-auto`}>S&apos;abonner — annuel</SubscribeButton>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-6">
          Paiement sécurisé via Stripe. Code « membres fondateurs » applicable à l&apos;étape de paiement.
          Résiliable à tout moment. 18+ — jouer comporte des risques.
        </p>
      </div>
    </main>
  )
}
