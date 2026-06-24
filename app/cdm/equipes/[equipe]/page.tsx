import Link from 'next/link'
import Header from '@/components/Header'
import { CDM_TEAM_PROFILES, getTeamBySlug } from '@/lib/cdm-teams'
import { ALL_CDM_PLAYERS } from '@/lib/cdm-players'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return CDM_TEAM_PROFILES.map(t => ({ equipe: t.slug }))
}

export default async function EquipePage({ params }: { params: Promise<{ equipe: string }> }) {
  const { equipe } = await params
  const team = getTeamBySlug(equipe)
  if (!team) notFound()

  const players = ALL_CDM_PLAYERS
    .filter(p => p.pays === team.pays)
    .sort((a, b) => b.note - a.note)

  const matchs = CDM_FIXTURES.filter(
    m => m.domicile === team.pays || m.exterieur === team.pays
  )

  const totalButs = players.reduce((s, p) => s + p.buts, 0)
  const totalxG = players.reduce((s, p) => s + p.xG, 0)
  const avgNote = players.length > 0
    ? (players.reduce((s, p) => s + p.note, 0) / players.length).toFixed(1)
    : '—'
  const meilleurButeur = players.sort((a, b) => b.buts - a.buts)[0]
  const meilleurPasseur = [...players].sort((a, b) => b.passes - a.passes)[0]

  const getFormeColor = (f: string) => {
    if (f === 'V') return 'bg-emerald-500'
    if (f === 'N') return 'bg-gray-500'
    return 'bg-red-500'
  }

  const sortedPlayers = ALL_CDM_PLAYERS
    .filter(p => p.pays === team.pays)
    .sort((a, b) => b.note - a.note)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <Link href="/cdm/equipes" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour équipes</Link>

        {/* Hero équipe */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-4 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{team.flag}</span>
              <div>
                <h1 className="text-3xl font-bold">{team.pays}</h1>
                <p className="text-gray-400 mt-1">Groupe {team.groupe} · {team.formation} · Coach : {team.selectionneur}</p>
                <p className="text-emerald-400 font-semibold mt-1">Classement FIFA #{team.classementFIFA}</p>
              </div>
            </div>
            <div className="text-center bg-gray-800 rounded-xl px-6 py-4">
              <p className="text-3xl font-bold text-emerald-400">{avgNote}</p>
              <p className="text-xs text-gray-500 mt-1">Note moy. effectif</p>
            </div>
          </div>
          <p className="mt-5 text-gray-300 italic text-sm border-l-2 border-emerald-500 pl-4">{team.ambitions}</p>
        </div>

        {/* Stats collectif */}
        {sortedPlayers.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '⚽ Buts totaux', val: totalButs, sub: `xG: ${totalxG.toFixed(1)}` },
              { label: '📊 Note moy.', val: avgNote, sub: `${sortedPlayers.length} joueurs` },
              { label: '🏆 Top buteur', val: meilleurButeur?.buts ?? '—', sub: meilleurButeur?.nom ?? '—' },
              { label: '🎯 Top passeur', val: meilleurPasseur?.passes ?? '—', sub: meilleurPasseur?.nom ?? '—' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-white mb-1">{s.val}</p>
                <p className="text-xs text-gray-500 truncate">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Forces / Faiblesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
            <h2 className="text-base font-bold text-emerald-400 mb-3">💪 Points forts</h2>
            <ul className="space-y-2">
              {team.pointsForts.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400 mt-0.5">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
            <h2 className="text-base font-bold text-red-400 mb-3">⚠️ Points faibles</h2>
            <ul className="space-y-2">
              {team.pointsFaibles.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-red-400 mt-0.5">✗</span> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Joueurs clés */}
        {sortedPlayers.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-emerald-400">👤 Joueurs dans notre base</h2>
            <div className="space-y-3">
              {sortedPlayers.map(player => (
                <Link key={player.id} href={`/cdm/joueurs/${player.id}`}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm">{player.nom}</p>
                      <p className="text-xs text-gray-400">{player.poste} · {player.club}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-gray-500">⚽ Buts</p>
                      <p className="font-bold text-sm">{player.buts}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-gray-500">xG</p>
                      <p className="font-bold text-sm text-gray-400">{player.xG}</p>
                    </div>
                    <div className="flex gap-1">
                      {player.forme.slice(-3).map((f, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full ${getFormeColor(f)} flex items-center justify-center text-xs font-bold text-white`}>
                          {f}
                        </div>
                      ))}
                    </div>
                    <p className="text-emerald-400 font-bold text-lg w-10 text-right">{player.note}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {sortedPlayers.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 text-center text-gray-500">
            <p>Aucun joueur disponible dans notre base pour cette équipe.</p>
            <p className="text-xs mt-1">Les profils détaillés seront ajoutés avec l'API avant le tournoi.</p>
          </div>
        )}

        {/* Matchs de groupe */}
        {matchs.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-emerald-400">📅 Matchs de groupe</h2>
            <div className="space-y-3">
              {matchs.map(match => {
                const isDomicile = match.domicile === team.pays
                const adversaire = isDomicile ? match.exterieur : match.domicile
                const flagAdversaire = isDomicile ? match.flagE : match.flagD
                return (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{team.flag}</span>
                      <span className="text-xs text-gray-400">{isDomicile ? 'vs' : '@'}</span>
                      <span className="text-lg">{flagAdversaire}</span>
                      <span className="text-sm font-semibold">{adversaire}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {match.heure}
                      </p>
                      <p className="text-xs text-gray-500">{match.stade}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Conseil paris */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3 text-emerald-400">💰 Analyse Deltavyn</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• <strong>Cote :</strong> {team.classementFIFA <= 5 ? '⭐ Grand favori — cotes basses mais très sûre en phase de groupes' : team.classementFIFA <= 15 ? '✅ Sérieux prétendant — bon rapport qualité/cote en poules' : team.classementFIFA <= 30 ? '⚠️ Compétitif — surveiller les matchs clés du groupe' : '🎲 Outsider — cotes intéressantes si l\'effectif performe'}</p>
            <p>• <strong>Buteur :</strong> {meilleurButeur ? `${meilleurButeur.nom} (${meilleurButeur.buts} buts, ${meilleurButeur.xG} xG) — référence offensive de l'équipe` : 'Aucun joueur référencé dans notre base'}</p>
            <p>• <strong>Tactique :</strong> {team.formation} — {team.pointsForts[0]}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
