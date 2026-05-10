import Link from 'next/link'
import Header from '@/components/Header'

type StatCard = {
  stat: string
  nom: string
  formule?: string
  description: string
  niveaux: { val: string; label: string; color: string }[]
  conseil: string
}

const STATS_LANCEURS: StatCard[] = [
  {
    stat: 'ERA',
    nom: 'Earned Run Average',
    formule: '(Points mérités ÷ Manches lancées) × 9',
    description: 'La stat de référence. Mesure combien de points un lanceur accorde en moyenne sur un match complet (9 manches). Plus le chiffre est bas, meilleur est le lanceur.',
    niveaux: [
      { val: '< 2.50', label: 'Élite — lanceur dominant', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { val: '2.50 – 3.50', label: 'Très bon', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { val: '3.50 – 4.50', label: 'Correct / Moyen', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { val: '> 4.50', label: 'Fragile — risqué', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ],
    conseil: 'Un lanceur ERA < 3.00 contre une équipe offensive moyenne = la cote de son équipe est souvent sous-évaluée par les bookmakers. C\'est là que se trouvent les value bets.'
  },
  {
    stat: 'WHIP',
    nom: 'Walks + Hits per Inning Pitched',
    formule: '(Buts sur balles + Coups sûrs accordés) ÷ Manches lancées',
    description: 'Mesure le contrôle du lanceur — combien de coureurs adverses il place sur les bases par manche. Un WHIP bas = peu de danger. Complète parfaitement l\'ERA car il détecte les lanceurs "chanceux" qui auraient dû accorder plus de points.',
    niveaux: [
      { val: '< 1.00', label: 'Exceptionnel', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { val: '1.00 – 1.15', label: 'Très bon', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { val: '1.15 – 1.30', label: 'Correct', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { val: '> 1.30', label: 'Trop de coureurs en jeu', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ],
    conseil: 'ERA 3.20 + WHIP 0.95 = lanceur solide et contrôlé. ERA 3.20 + WHIP 1.45 = lanceur chanceux, sa ERA va empirer. Le WHIP prédit l\'avenir, l\'ERA photographie le passé.'
  },
  {
    stat: 'K/9',
    nom: 'Strikeouts par 9 manches',
    formule: '(Retraits au bâton ÷ Manches lancées) × 9',
    description: 'Mesure le pouvoir de domination d\'un lanceur. Un lanceur qui retire beaucoup de frappeurs (strikeouts) dépend moins de sa défense derrière lui et est plus fiable pour les paris.',
    niveaux: [
      { val: '> 10.0', label: 'Dominant — électrique', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { val: '8.0 – 10.0', label: 'Bon swing-and-miss', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { val: '6.0 – 8.0', label: 'Dans la moyenne', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { val: '< 6.0', label: 'Contact pitcher — risqué', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ],
    conseil: 'Lanceur K/9 élevé = défense moins sollicitée = résultats plus prévisibles. Utile pour les paris sur le nombre total de retraits (prop bet) ou pour valider un pari sur son équipe.'
  },
]

const STATS_FRAPPEURS: StatCard[] = [
  {
    stat: 'AVG',
    nom: 'Batting Average — Moyenne au bâton',
    formule: 'Coups sûrs ÷ Passages au bâton officiels',
    description: 'La stat la plus connue en baseball. Mesure la fréquence à laquelle un frappeur réussit un coup sûr. Simple mais incomplète — elle n\'inclut pas les walks ni la puissance de frappe.',
    niveaux: [
      { val: '> .300', label: 'Frappeur d\'élite', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { val: '.270 – .300', label: 'Très bon', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { val: '.240 – .270', label: 'Dans la moyenne', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { val: '< .230', label: 'Frappeur en difficulté', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ],
    conseil: 'Seule, l\'AVG est limitée. Un frappeur à .270 avec beaucoup de home runs peut être plus précieux qu\'un frappeur à .310 sans puissance. Toujours combiner avec OPS.'
  },
  {
    stat: 'OBP',
    nom: 'On-Base Percentage — Taux sur base',
    formule: '(Coups sûrs + Walks + Touchés) ÷ (AB + Walks + Touchés + Sacrifices)',
    description: 'Mesure à quelle fréquence un frappeur arrive sur les bases, quelle que soit la méthode. Inclut les walks qu\'AVG ignore. Plus fiable qu\'AVG pour évaluer la contribution offensive réelle.',
    niveaux: [
      { val: '> .380', label: 'Élite', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { val: '.350 – .380', label: 'Très bon', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { val: '.320 – .350', label: 'Correct', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { val: '< .310', label: 'Faible', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ],
    conseil: 'Un frappeur OBP élevé en tête de lineup = plus de coureurs sur base pour les power hitters derrière lui = plus de points. Important pour évaluer la force offensive globale d\'une équipe.'
  },
  {
    stat: 'SLG',
    nom: 'Slugging Percentage — Puissance de frappe',
    formule: 'Bases totales ÷ Passages au bâton officiels',
    description: 'Mesure la puissance de frappe. Un simple = 1 base, un double = 2, un triple = 3, un home run = 4. Plus le chiffre est élevé, plus le frappeur produit des hits de puissance.',
    niveaux: [
      { val: '> .550', label: 'Power hitter élite', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { val: '.470 – .550', label: 'Très bon', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { val: '.400 – .470', label: 'Correct', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { val: '< .380', label: 'Peu de puissance', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ],
    conseil: 'Pour les paris home run, SLG > .500 + HR/AB élevé = frappeur à cibler. Pour les paris over/under total, une lineup avec SLG collectif élevé = tendance à marquer beaucoup.'
  },
  {
    stat: 'OPS',
    nom: 'On-base Plus Slugging',
    formule: 'OBP + SLG',
    description: 'La stat offensive la plus complète et la plus utilisée par les analystes. Combine l\'aptitude à arriver sur les bases (OBP) et la puissance de frappe (SLG). Donne une image quasi-complète de la valeur offensive d\'un frappeur.',
    niveaux: [
      { val: '> 1.000', label: 'MVP — frappeur d\'exception', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      { val: '.900 – 1.000', label: 'Excellent', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      { val: '.750 – .900', label: 'Au-dessus de la moyenne', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      { val: '< .700', label: 'Frappeur faible', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    ],
    conseil: 'C\'est la première stat à regarder pour évaluer un frappeur. OPS > .950 contre un lanceur fragile (ERA > 4.50) = grosse opportunité sur le total de points (over) ou en pari buteur (home run).'
  },
]

const TYPES_PARIS = [
  {
    type: 'Moneyline',
    icon: '1️⃣',
    description: 'Tu parles simplement sur l\'équipe gagnante. Pas de handicap, pas de spread. Le plus simple en MLB.',
    exemple: 'Dodgers -155 vs Padres +135 → Miser 155€ sur LAD pour gagner 100€, ou 100€ sur SD pour gagner 135€',
    quand: 'Lanceur dominant (ERA < 3.00) face à une attaque faible. La cote de l\'équipe avec le meilleur lanceur est souvent sous-évaluée sur les petits marchés.',
    risque: '⭐⭐',
  },
  {
    type: 'Run Line',
    icon: '±1.5',
    description: 'Équivalent du handicap en football. Le favori doit gagner par 2+ points, l\'outsider peut perdre d\'un point.',
    exemple: 'Dodgers -1.5 (+115) → LAD doit gagner de 2+ points pour que ton pari soit gagnant',
    quand: 'Quand le lanceur du favori est très dominant ET que leur attaque est forte. Éviter si le match risque d\'être serré.',
    risque: '⭐⭐⭐',
  },
  {
    type: 'Total (Over/Under)',
    icon: 'O/U',
    description: 'Tu paries sur le nombre total de points marqués par les deux équipes combinées. Le bookmaker fixe un total, tu joues Over ou Under.',
    exemple: 'Total fixé à 8.5 → Over = les deux équipes marquent 9+ points, Under = 8 points ou moins',
    quand: 'UNDER : deux lanceurs dominants (ERA < 3.00). OVER : deux lanceurs fragiles (ERA > 4.50) ou matchup avec lineups offensives de qualité.',
    risque: '⭐⭐',
  },
  {
    type: 'First 5 Innings (F5)',
    icon: 'F5',
    description: 'Paris uniquement sur les 5 premières manches, avant que les bullpens interviennent. Idéal pour isoler l\'impact du lanceur partant.',
    exemple: 'Yankees F5 -0.5 → NY doit mener après 5 manches pour que tu gagnes',
    quand: 'Quand le lanceur partant est dominateur MAIS que le bullpen de son équipe est fragile. Tu profites du lanceur sans risquer les releveurs.',
    risque: '⭐⭐',
  },
]

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <Link href="/mlb" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour MLB</Link>

        <div className="mt-4 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">⚾</span>
            <h1 className="text-4xl font-bold">Guide MLB pour parieurs</h1>
          </div>
          <p className="text-gray-400">Comprendre les stats avancées du baseball pour prendre de meilleures décisions de paris</p>
        </div>

        {/* Intro rapide */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold text-emerald-400 mb-3">🎯 Pourquoi le MLB est excellent pour le value betting ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="bg-gray-900/50 rounded-xl p-3">
              <p className="font-bold text-white mb-1">📅 162 matchs / équipe</p>
              <p>Énorme volume de données. Les modèles statistiques sont très fiables — bien plus qu'en football (38 matchs).</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3">
              <p className="font-bold text-white mb-1">🥎 Le lanceur = tout</p>
              <p>Le lanceur partant explique ~60% du résultat d'un match. Maîtriser ERA + WHIP suffit pour identifier des value bets.</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3">
              <p className="font-bold text-white mb-1">📊 Stats publiques</p>
              <p>L'API officielle MLB est 100% gratuite. Tu as accès aux mêmes données que les professionnels.</p>
            </div>
          </div>
        </div>

        {/* Stats lanceurs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">🥎 Stats des lanceurs</h2>
          <p className="text-gray-400 text-sm mb-6">Le lanceur partant est le facteur #1 en MLB. Ces 3 stats te donnent une image complète de sa valeur.</p>
          <div className="space-y-6">
            {STATS_LANCEURS.map(s => <StatBlock key={s.stat} {...s} />)}
          </div>
        </section>

        {/* Stats frappeurs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">🏏 Stats des frappeurs</h2>
          <p className="text-gray-400 text-sm mb-6">Pour évaluer la force offensive d'un frappeur ou d'une équipe face à un lanceur fragile.</p>
          <div className="space-y-6">
            {STATS_FRAPPEURS.map(s => <StatBlock key={s.stat} {...s} />)}
          </div>
        </section>

        {/* Types de paris */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">💰 Les types de paris MLB</h2>
          <p className="text-gray-400 text-sm mb-6">Les 4 marchés les plus utilisés, avec les conditions idéales pour trouver de la value.</p>
          <div className="space-y-4">
            {TYPES_PARIS.map(p => (
              <div key={p.type} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-emerald-400 w-12 text-center">{p.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{p.type}</h3>
                      <p className="text-gray-400 text-sm">{p.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 mb-0.5">Risque</p>
                    <p className="text-sm">{p.risque}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Exemple</p>
                    <p className="text-sm text-gray-300">{p.exemple}</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-xs text-emerald-400 mb-1">Quand jouer ?</p>
                    <p className="text-sm text-gray-300">{p.quand}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cheat sheet */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2">⚡ Cheat sheet — Analyse rapide d'un matchup</h2>
          <p className="text-gray-400 text-sm mb-4">Avant de miser, pose-toi ces 4 questions en 2 minutes :</p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            {[
              {
                q: '1. Qui lance pour chaque équipe ?',
                r: 'Cherche ERA + WHIP des deux lanceurs. Si écart important → avantage clair.',
                icon: '🥎'
              },
              {
                q: '2. Comment sont les attaques ?',
                r: 'OPS collectif de chaque lineup. Lineup OPS > .780 = dangereuse pour un lanceur fragile.',
                icon: '🏏'
              },
              {
                q: '3. Quelle est la forme récente ?',
                r: 'Regarde le L10 (10 derniers matchs) dans les classements. Une équipe 8-2 L10 est en feu.',
                icon: '📈'
              },
              {
                q: '4. La cote est-elle logique ?',
                r: 'Utilise le calculateur ValueBet. Si la cote proposée > cote juste selon ton analyse → parie.',
                icon: '💰'
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-gray-800 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold mb-0.5">{item.q}</p>
                  <p className="text-sm text-gray-400">{item.r}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lexique */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📖 Mini lexique baseball</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { mot: 'Manche (Inning)', def: 'Unité de jeu. Chaque équipe batte une fois par manche. Un match = 9 manches.' },
              { mot: 'Retrait (Out)', def: '3 retraits = fin de demi-manche. Le lanceur cherche à faire 3 outs le plus vite possible.' },
              { mot: 'Coup sûr (Hit)', def: 'Le frappeur atteint les bases grâce à sa frappe. Single (1B), Double (2B), Triple (3B), Home Run (HR).' },
              { mot: 'But sur balles (Walk/BB)', def: '4 lancers hors zone = le frappeur marche vers le premier but. Signe de mauvais contrôle du lanceur.' },
              { mot: 'Retrait au bâton (Strikeout/K)', def: '3 prises = retrait au bâton. Signe de domination du lanceur.' },
              { mot: 'Home Run (HR)', def: 'La balle sort du terrain en jeu. Tous les coureurs sur les bases + le frappeur marquent.' },
              { mot: 'Lanceur partant (SP)', def: 'Lance les 5 à 7 premières manches. Facteur #1 pour parier sur un match.' },
              { mot: 'Bullpen', def: 'Les lanceurs de relève. Interviennent après le lanceur partant. Un bullpen faible peut coûter la victoire.' },
              { mot: 'Lineup', def: 'L\'ordre de passage au bâton des 9 frappeurs. Les positions 3-4-5 sont les plus puissants (cleanup hitters).' },
              { mot: 'DH (Designated Hitter)', def: 'Frappeur spécialisé qui joue à la place du lanceur en AL. La NL a adopté le DH en 2022.' },
            ].map(item => (
              <div key={item.mot} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="font-bold text-emerald-400 text-sm mb-1">{item.mot}</p>
                <p className="text-sm text-gray-400">{item.def}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
          <p className="text-lg font-bold mb-2">Prêt à analyser les matchs du jour ?</p>
          <p className="text-gray-400 text-sm mb-4">Utilise ce guide + les stats en temps réel pour trouver tes value bets</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/mlb/calendrier"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
              📅 Matchups du jour
            </Link>
            <Link href="/mlb/joueurs"
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
              👤 Stats lanceurs & frappeurs
            </Link>
            <Link href="/paris/calculateur"
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
              🎯 Calculateur ValueBet
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

// ---- Composant réutilisable carte stat ----
function StatBlock({ stat, nom, formule, description, niveaux, conseil }: StatCard) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">{stat}</span>
            <h3 className="font-bold text-lg">{nom}</h3>
          </div>
          {formule && (
            <p className="text-xs text-gray-600 font-mono bg-gray-800 px-3 py-1 rounded-lg inline-block mt-1">
              {formule}
            </p>
          )}
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-4">{description}</p>

      {/* Niveaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {niveaux.map((n, i) => (
          <div key={i} className={`border rounded-xl p-2.5 text-center ${n.color}`}>
            <p className="font-bold text-sm mb-0.5">{n.val}</p>
            <p className="text-xs opacity-80">{n.label}</p>
          </div>
        ))}
      </div>

      {/* Conseil paris */}
      <div className="bg-gray-800 rounded-xl p-3 flex gap-2">
        <span className="text-lg shrink-0">💡</span>
        <p className="text-sm text-gray-300"><strong className="text-white">Paris :</strong> {conseil}</p>
      </div>
    </div>
  )
}
