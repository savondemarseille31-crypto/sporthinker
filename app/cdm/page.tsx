import Link from 'next/link'
import Header from '@/components/Header'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { CDM_GROUPS } from '@/lib/cdm-groups'

export default function CdmPage() {
  const today = new Date().toISOString().slice(0, 10)
  const prochainMatchs = CDM_FIXTURES.filter(m => m.date >= today).slice(0, 6)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🌍 Coupe du Monde 2026</h1>
          <p className="text-gray-400">USA · Canada · Mexique · 11 juin – 19 juillet 2026</p>
        </div>

        {/* Raccourcis */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <Link href="/cdm/groupes" className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors text-center">
            <div className="text-3xl mb-2">🗂️</div>
            <p className="font-semibold">Groupes</p>
            <p className="text-xs text-gray-500 mt-1">12 groupes · 48 équipes</p>
          </Link>
          <Link href="/cdm/equipes" className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors text-center">
            <div className="text-3xl mb-2">🌍</div>
            <p className="font-semibold">Équipes</p>
            <p className="text-xs text-gray-500 mt-1">Profils & forces/faiblesses</p>
          </Link>
          <Link href="/cdm/calendrier" className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="font-semibold">Calendrier</p>
            <p className="text-xs text-gray-500 mt-1">72 matchs · Phase de groupes</p>
          </Link>
          <Link href="/cdm/joueurs" className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors text-center">
            <div className="text-3xl mb-2">👤</div>
            <p className="font-semibold">Joueurs</p>
            <p className="text-xs text-gray-500 mt-1">Stats & profils xG/xA</p>
          </Link>
          <Link href="/cdm/signaux" className="bg-gray-900 border border-emerald-500/40 rounded-2xl p-5 hover:border-emerald-500 transition-colors text-center">
            <div className="text-3xl mb-2">⚡</div>
            <p className="font-semibold text-emerald-400">Signaux</p>
            <p className="text-xs text-gray-500 mt-1">Props joueurs & matchs</p>
          </Link>
        </div>

        {/* Prochains matchs */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-emerald-400">Prochains matchs</h2>
            <Link href="/cdm/calendrier" className="text-sm text-gray-500 hover:text-emerald-400 transition-colors">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prochainMatchs.map((match) => (
              <Link key={match.id} href={`/cdm/matchup/${match.id}`} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-emerald-500 transition-colors block">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Groupe {match.groupe}</span>
                  <span className="text-xs text-gray-500">{new Date(`${match.date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {match.heure}</span>
                </div>
                <div className="grid grid-cols-[1fr_40px_1fr] items-center">
                  <div className="text-center">
                    <p className="text-2xl mb-1">{match.flagD}</p>
                    <p className="text-sm font-semibold">{match.domicile}</p>
                  </div>
                  <div className="text-emerald-400 font-bold text-center">VS</div>
                  <div className="text-center">
                    <p className="text-2xl mb-1">{match.flagE}</p>
                    <p className="text-sm font-semibold">{match.exterieur}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Groupes aperçu */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-emerald-400">Groupes</h2>
            <Link href="/cdm/groupes" className="text-sm text-gray-500 hover:text-emerald-400 transition-colors">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.keys(CDM_GROUPS).map((g) => (
              <Link key={g} href={`/cdm/groupes`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-emerald-500 transition-colors">
                <p className="text-emerald-400 font-bold mb-2">Groupe {g}</p>
                {CDM_GROUPS[g as keyof typeof CDM_GROUPS].teams.map((t) => (
                  <p key={t} className="text-xs text-gray-400">{t}</p>
                ))}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
