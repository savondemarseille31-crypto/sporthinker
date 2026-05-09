export type TeamProfile = {
  pays: string
  slug: string
  flag: string
  groupe: string
  selectionneur: string
  classementFIFA: number
  formation: string
  pointsForts: string[]
  pointsFaibles: string[]
  ambitions: string
}

export function pays2slug(pays: string): string {
  return pays.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
}

export function getTeamBySlug(slug: string): TeamProfile | undefined {
  return CDM_TEAM_PROFILES.find(t => t.slug === slug)
}

export const CDM_TEAM_PROFILES: TeamProfile[] = [
  // GROUPE A
  {
    pays: 'Mexico', slug: 'mexico', flag: '🇲🇽', groupe: 'A',
    selectionneur: 'Javier Aguirre', classementFIFA: 16,
    formation: '4-3-3',
    pointsForts: ['Expérience des grandes compétitions', 'Soutien du public (pays hôte)', 'Solidité défensive'],
    pointsFaibles: ['Manque de profondeur offensive', 'Pression de jouer à domicile'],
    ambitions: 'Sortir des poules et franchir le cap des 8e de finale pour la première fois'
  },
  {
    pays: 'Ecuador', slug: 'ecuador', flag: '🇪🇨', groupe: 'A',
    selectionneur: 'Sebastián Beccacece', classementFIFA: 25,
    formation: '4-4-2',
    pointsForts: ['Cohésion collective', 'Milieu de terrain de classe mondiale (Caicedo)', 'Pressing intense'],
    pointsFaibles: ['Manque d\'expérience en phase finale', 'Attaque trop dépendante de Valencia'],
    ambitions: 'Passer les groupes et confirmer la montée en puissance du football équatorien'
  },
  {
    pays: 'Jamaica', slug: 'jamaica', flag: '🇯🇲', groupe: 'A',
    selectionneur: 'Theodore Whitmore', classementFIFA: 43,
    formation: '4-2-3-1',
    pointsForts: ['Vitesse et athlétisme', 'Ambiance et combativité', 'Antonio référence offensive'],
    pointsFaibles: ['Niveau global limité', 'Manque d\'expérience en CdM', 'Faible classement FIFA'],
    ambitions: 'Créer la surprise et se qualifier pour les 8e dans un groupe abordable'
  },
  {
    pays: 'Venezuela', slug: 'venezuela', flag: '🇻🇪', groupe: 'A',
    selectionneur: 'Fernando Batista', classementFIFA: 40,
    formation: '4-4-2',
    pointsForts: ['Caractère offensif', 'Rondón expérimenté en attaque', 'Surprise potentielle'],
    pointsFaibles: ['Irrégularité des performances', 'Défense vulnérable', 'Manque de joueurs élite'],
    ambitions: 'Marquer l\'histoire en atteignant les 8e de finale pour la première fois'
  },
  // GROUPE B
  {
    pays: 'USA', slug: 'usa', flag: '🇺🇸', groupe: 'B',
    selectionneur: 'Mauricio Pochettino', classementFIFA: 14,
    formation: '4-3-3',
    pointsForts: ['Génération dorée (Pulisic, Reyna, Adams)', 'Soutien du public (pays hôte)', 'Athlétisme et pressing'],
    pointsFaibles: ['Pression d\'être pays hôte', 'Manque de régularité au plus haut niveau'],
    ambitions: 'Atteindre les quarts de finale et marquer l\'histoire du football américain'
  },
  {
    pays: 'Panama', slug: 'panama', flag: '🇵🇦', groupe: 'B',
    selectionneur: 'Thomas Christiansen', classementFIFA: 45,
    formation: '5-4-1',
    pointsForts: ['Organisation défensive solide', 'Expérience CONCACAF', 'Combativité'],
    pointsFaibles: ['Manque de qualité offensive', 'Niveau limité face aux top nations', 'Peu de joueurs évoluant en Europe'],
    ambitions: 'Se qualifier pour les 8e de finale et écrire une nouvelle page de l\'histoire panaméenne'
  },
  {
    pays: 'Bolivia', slug: 'bolivia', flag: '🇧🇴', groupe: 'B',
    selectionneur: 'Oscar Villegas', classementFIFA: 41,
    formation: '4-4-2',
    pointsForts: ['Avantage altitude en CONMEBOL', 'Esprit collectif', 'Public enthousiaste'],
    pointsFaibles: ['Niveau offensif limité', 'Peu de stars reconnues internationalement', 'Défense fragile'],
    ambitions: 'Retrouver la compétition mondiale et décrocher au moins un point historique'
  },
  {
    pays: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿', groupe: 'B',
    selectionneur: 'Darren Bazeley', classementFIFA: 42,
    formation: '4-5-1',
    pointsForts: ['Chris Wood, buteur de Premier League', 'Solidité défensive', 'Qualification via OFC'],
    pointsFaibles: ['Niveau compétitif limité (confédération OFC faible)', 'Peu de joueurs élite', 'Manque d\'expérience mondiale'],
    ambitions: 'Sortir des poules pour la première fois dans l\'histoire des All Whites'
  },
  // GROUPE C
  {
    pays: 'Canada', slug: 'canada', flag: '🇨🇦', groupe: 'C',
    selectionneur: 'Jesse Marsch', classementFIFA: 26,
    formation: '4-3-3',
    pointsForts: ['Génération talentueuse (Davies, David)', 'Vitesse sur les ailes', 'Pays hôte — soutien public'],
    pointsFaibles: ['Manque d\'expérience internationale au plus haut niveau', 'Pression de la première CdM à domicile'],
    ambitions: 'Atteindre les quarts de finale — tournoi historique pour le football canadien'
  },
  {
    pays: 'Honduras', slug: 'honduras', flag: '🇭🇳', groupe: 'C',
    selectionneur: 'Reinaldo Rueda', classementFIFA: 44,
    formation: '4-3-3',
    pointsForts: ['Combativité et caractère', 'Expérience CONCACAF', 'Quioto dangereux sur son côté'],
    pointsFaibles: ['Niveau global limité', 'Peu de joueurs évoluant en Europe', 'Défense fragile'],
    ambitions: 'Créer la surprise et sortir des groupes dans un groupe difficile'
  },
  {
    pays: 'Chile', slug: 'chile', flag: '🇨🇱', groupe: 'C',
    selectionneur: 'Ricardo Gareca', classementFIFA: 31,
    formation: '4-2-3-1',
    pointsForts: ['Expérience internationale (2 Copa América)', 'Alexis Sánchez encore décisif', 'Pressing haut organisé'],
    pointsFaibles: ['Génération vieillissante', 'Transition difficile entre générations', 'Qualification obtenue de justesse'],
    ambitions: 'Sortir des poules et prouver que la Roja peut encore rivaliser au sommet'
  },
  {
    pays: 'Australia', slug: 'australia', flag: '🇦🇺', groupe: 'C',
    selectionneur: 'Tony Popovic', classementFIFA: 35,
    formation: '4-2-3-1',
    pointsForts: ['Organisation collective', 'Solidité défensive', 'Expérience CdM 2022 (quarts de finale)'],
    pointsFaibles: ['Manque de profondeur dans l\'effectif', 'Distance géographique défavorable', 'Niveau offensive limité'],
    ambitions: 'Retrouver les quarts de finale comme en 2022 et confirmer la progression'
  },
  // GROUPE D
  {
    pays: 'France', slug: 'france', flag: '🇫🇷', groupe: 'D',
    selectionneur: 'Didier Deschamps', classementFIFA: 2,
    formation: '4-3-3',
    pointsForts: ['Mbappé, meilleur joueur du monde', 'Profondeur de l\'effectif exceptionnelle', 'Expérience en finale mondiale (2018, 2022)'],
    pointsFaibles: ['Pression médiatique intense', 'Griezmann vieillissant', 'Instabilité dans les grandes compétitions'],
    ambitions: 'Aller chercher le troisième titre mondial après 1998 et 2018'
  },
  {
    pays: 'Morocco', slug: 'morocco', flag: '🇲🇦', groupe: 'D',
    selectionneur: 'Walid Regragui', classementFIFA: 15,
    formation: '4-3-3',
    pointsForts: ['Demi-finaliste 2022 (exploit historique)', 'Solidité défensive redoutable', 'Hakimi et Ziyech au sommet'],
    pointsFaibles: ['Dépendance aux performances individuelles', 'Niveau offensif parfois limité'],
    ambitions: 'Aller encore plus loin qu\'en 2022 et viser le dernier carré'
  },
  {
    pays: 'Senegal', slug: 'senegal', flag: '🇸🇳', groupe: 'D',
    selectionneur: 'Aliou Cissé', classementFIFA: 18,
    formation: '4-3-3',
    pointsForts: ['Mané toujours décisif', 'Solidité collective', 'Athlétisme et physique'],
    pointsFaibles: ['Manque de régularité', 'Trop dépendant de Mané', 'Irrégularité offensive'],
    ambitions: 'Répéter le parcours 2022 (huitièmes) et aller plus loin en quarts'
  },
  {
    pays: 'Uzbekistan', slug: 'uzbekistan', flag: '🇺🇿', groupe: 'D',
    selectionneur: 'Srecko Katanec', classementFIFA: 46,
    formation: '4-4-2',
    pointsForts: ['Qualification historique en CdM', 'Shomurodov expérimenté en Serie A', 'Cohésion collective'],
    pointsFaibles: ['Premier WC de l\'histoire — manque d\'expérience', 'Niveau globalement limité', 'Groupe très difficile (France, Maroc)'],
    ambitions: 'Vivre la première CdM de l\'histoire ouzbèke et créer la surprise'
  },
  // GROUPE E
  {
    pays: 'Germany', slug: 'germany', flag: '🇩🇪', groupe: 'E',
    selectionneur: 'Julian Nagelsmann', classementFIFA: 9,
    formation: '4-2-3-1',
    pointsForts: ['Wirtz et Musiala, duo d\'exception', 'Collectif rodé', 'Expérience en grandes compétitions'],
    pointsFaibles: ['Défense parfois hésitante', 'Manque d\'un vrai attaquant de pointe', 'Pression d\'une nation en reconstruction'],
    ambitions: 'Redevenir champions du monde après la déception de 2018 et 2022'
  },
  {
    pays: 'Colombia', slug: 'colombia', flag: '🇨🇴', groupe: 'E',
    selectionneur: 'Néstor Lorenzo', classementFIFA: 13,
    formation: '4-3-3',
    pointsForts: ['Luis Díaz explosif', 'James Rodríguez en fin de carrière brillante', 'Jeu offensif spectaculaire'],
    pointsFaibles: ['Défense fragile', 'Irrégularité sur 90 minutes', 'Dépendance au génie individuel'],
    ambitions: 'Retrouver les quarts de finale et confirmer le titre Copa América 2024'
  },
  {
    pays: 'Uruguay', slug: 'uruguay', flag: '🇺🇾', groupe: 'E',
    selectionneur: 'Marcelo Bielsa', classementFIFA: 12,
    formation: '4-3-3',
    pointsForts: ['Darwin Núñez dévastateur', 'Caractère et résistance mentale', 'Expérience de la Celeste en CdM'],
    pointsFaibles: ['Effectif moins profond que les favoris', 'Défense vieillissante', 'Jeu parfois trop direct'],
    ambitions: 'Atteindre les quarts de finale et peut-être surprendre l\'un des favoris'
  },
  {
    pays: 'Japan', slug: 'japan', flag: '🇯🇵', groupe: 'E',
    selectionneur: 'Hajime Moriyasu', classementFIFA: 17,
    formation: '4-2-3-1',
    pointsForts: ['Technicité et discipline tactique', 'Kubo et Mitoma dans le monde élite', 'Organisation collective parfaite'],
    pointsFaibles: ['Manque de physique face aux équipes européennes', 'Pression du dernier carré jamais atteint'],
    ambitions: 'Atteindre les demi-finales pour la première fois de l\'histoire japonaise'
  },
  // GROUPE F
  {
    pays: 'Portugal', slug: 'portugal', flag: '🇵🇹', groupe: 'F',
    selectionneur: 'Roberto Martínez', classementFIFA: 6,
    formation: '4-2-3-1',
    pointsForts: ['Ronaldo et ses 900+ buts', 'Bruno Fernandes maestro du jeu', 'Leão et Bernardo Silva brillants'],
    pointsFaibles: ['Dépendance à Ronaldo', 'Défense parfois fragile sur corner', 'Pression médiatique autour de CR7'],
    ambitions: 'Remporter le premier titre mondial portugais — la quête ultime de Ronaldo'
  },
  {
    pays: 'Argentina', slug: 'argentina', flag: '🇦🇷', groupe: 'F',
    selectionneur: 'Lionel Scaloni', classementFIFA: 1,
    formation: '4-3-3',
    pointsForts: ['Messi, champion du monde en titre', 'Collectif soudé et champion', 'Álvarez et Lautaro en feu'],
    pointsFaibles: ['Messi à 38 ans — dernière CdM', 'Après le titre, motivation à confirmer', 'Défense pas invincible'],
    ambitions: 'Défendre le titre et offrir à Messi un dernier sacre en apothéose'
  },
  {
    pays: 'South Africa', slug: 'south-africa', flag: '🇿🇦', groupe: 'F',
    selectionneur: 'Hugo Broos', classementFIFA: 36,
    formation: '4-1-4-1',
    pointsForts: ['Percy Tau technique et efficace', 'Surprise potentielle', 'Motivation du retour en CdM'],
    pointsFaibles: ['Groupe très difficile (Portugal, Argentine)', 'Effectif limité', 'Peu de joueurs évoluant dans les top championnats'],
    ambitions: 'Créer une ou deux surprises et passer les poules dans un groupe de la mort'
  },
  {
    pays: 'South Korea', slug: 'south-korea', flag: '🇰🇷', groupe: 'F',
    selectionneur: 'Hong Myung-bo', classementFIFA: 21,
    formation: '4-2-3-1',
    pointsForts: ['Son Heung-min, star mondiale', 'Collectif bien organisé', 'Expérience en grandes compétitions'],
    pointsFaibles: ['Trop dépendant de Son', 'Milieu parfois dominé face aux tops', 'Manque de profondeur offensive'],
    ambitions: 'Retrouver les quarts de finale et pourquoi pas égaler l\'exploit de 2002'
  },
  // GROUPE G
  {
    pays: 'Spain', slug: 'spain', flag: '🇪🇸', groupe: 'G',
    selectionneur: 'Luis de la Fuente', classementFIFA: 3,
    formation: '4-3-3',
    pointsForts: ['Lamine Yamal, prodige de 18 ans', 'Jeu de possession total', 'Profondeur et qualité partout'],
    pointsFaibles: ['Pression après l\'Euro 2024', 'Morata pas toujours décisif', 'Peut manquer de cyisme'],
    ambitions: 'Remporter le titre mondial après l\'Euro 2024 — doublet historique'
  },
  {
    pays: 'Brazil', slug: 'brazil', flag: '🇧🇷', groupe: 'G',
    selectionneur: 'Dorival Júnior', classementFIFA: 5,
    formation: '4-2-3-1',
    pointsForts: ['Vinicius Jr., Ballon d\'Or potentiel', 'Creativité brésilienne légendaire', 'Raphinha en feu au Barça'],
    pointsFaibles: ['Défense pas assez solide', 'Sans titre depuis 2002 — manque de sérénité', 'Endrick encore tendre'],
    ambitions: 'Mettre fin au jeûne de 24 ans et redevenir Hexacampeões'
  },
  {
    pays: 'Nigeria', slug: 'nigeria', flag: '🇳🇬', groupe: 'G',
    selectionneur: 'Finidi George', classementFIFA: 34,
    formation: '4-3-3',
    pointsForts: ['Osimhen, l\'un des meilleurs attaquants africains', 'Athlétisme et physique', 'Talent offensif pur'],
    pointsFaibles: ['Irrégularité chronique', 'Organisation défensive perfectible', 'Effectif inégal'],
    ambitions: 'Atteindre les quarts de finale — objectif déclaré des Super Eagles'
  },
  {
    pays: 'Saudi Arabia', slug: 'saudi-arabia', flag: '🇸🇦', groupe: 'G',
    selectionneur: 'Roberto Mancini', classementFIFA: 33,
    formation: '4-2-3-1',
    pointsForts: ['Al-Dawsari, héros du but contre l\'Argentine 2022', 'Jeu bien organisé', 'Saudi Pro League de plus en plus relevée'],
    pointsFaibles: ['Niveau global limité face aux top nations', 'Manque d\'expérience européenne', 'Groupe de la mort (Espagne, Brésil)'],
    ambitions: 'Répéter la surprise de 2022 et sortir des poules face aux géants'
  },
  // GROUPE H
  {
    pays: 'England', slug: 'england', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupe: 'H',
    selectionneur: 'Thomas Tuchel', classementFIFA: 4,
    formation: '4-3-3',
    pointsForts: ['Bellingham et Kane, duo d\'exception', 'Profondeur de l\'effectif', 'Premier League — meilleur championnat du monde'],
    pointsFaibles: ['Pression du titre toujours absent', 'Tirs aux buts historiquement catastrophiques', 'Parfois trop individuels'],
    ambitions: '60 ans d\'attente — remporter enfin le premier titre mondial anglais'
  },
  {
    pays: 'Netherlands', slug: 'netherlands', flag: '🇳🇱', groupe: 'H',
    selectionneur: 'Ronald Koeman', classementFIFA: 7,
    formation: '4-3-3',
    pointsForts: ['Van Dijk, roc défensif', 'Gakpo et Depay redoutables', 'Héritage total football'],
    pointsFaibles: ['Manque de régularité dans les grands tournois', 'Trop dépendant de quelques individualités'],
    ambitions: 'Atteindre les demi-finales après le bon Euro 2024'
  },
  {
    pays: 'DR Congo', slug: 'dr-congo', flag: '🇨🇩', groupe: 'H',
    selectionneur: 'Sébastien Desabre', classementFIFA: 48,
    formation: '4-3-3',
    pointsForts: ['Bakambu expérimenté', 'Athlétisme naturel', 'Surprise potentielle de la compétition'],
    pointsFaibles: ['Groupe très difficile (Angleterre, Pays-Bas)', 'Effectif limité', 'Peu d\'expérience en CdM'],
    ambitions: 'Marquer l\'histoire et créer une surprise dans un groupe difficile'
  },
  {
    pays: 'Qatar', slug: 'qatar', flag: '🇶🇦', groupe: 'H',
    selectionneur: 'Félix Sánchez', classementFIFA: 30,
    formation: '3-5-2',
    pointsForts: ['Akram Afif, meilleur joueur Coupe d\'Asie 2023', 'Organisation et discipline', 'Expérience de 2022'],
    pointsFaibles: ['Niveau compétitif limité (éliminé au 1er tour en 2022)', 'Groupe très difficile', 'Peu de joueurs évoluant à l\'étranger'],
    ambitions: 'Se qualifier pour les 8e et faire mieux que 2022 sur sol étranger'
  },
  // GROUPE I
  {
    pays: 'Belgium', slug: 'belgium', flag: '🇧🇪', groupe: 'I',
    selectionneur: 'Rudi Garcia', classementFIFA: 8,
    formation: '3-4-3',
    pointsForts: ['De Bruyne, meilleur passeur du monde', 'Lukaku, machine à buts', 'Expérience de la génération dorée'],
    pointsFaibles: ['Génération en fin de cycle', 'Défense vieillissante', 'Sans titre malgré les talents'],
    ambitions: 'Gagner enfin un grand titre avant la fin de la génération dorée'
  },
  {
    pays: 'Egypt', slug: 'egypt', flag: '🇪🇬', groupe: 'I',
    selectionneur: 'Hassan Kabrani', classementFIFA: 19,
    formation: '4-3-3',
    pointsForts: ['Mohamed Salah, l\'un des meilleurs du monde', 'Organisation défensive solide', 'Expérience CAN'],
    pointsFaibles: ['Trop dépendant de Salah', 'Profondeur de l\'effectif limitée', 'Manque d\'expérience en CdM'],
    ambitions: 'Salah veut son premier titre mondial après les titres CAN en échec'
  },
  {
    pays: 'Peru', slug: 'peru', flag: '🇵🇪', groupe: 'I',
    selectionneur: 'Jorge Fossati', classementFIFA: 37,
    formation: '4-4-2',
    pointsForts: ['Expérience CdM (2018)', 'Lapadula battant et efficace', 'Esprit collectif fort'],
    pointsFaibles: ['Effectif vieillissant', 'Qualification obtenue en barrage', 'Manque de vitesse sur les ailes'],
    ambitions: 'Passer les poules pour la deuxième fois après 2018'
  },
  {
    pays: 'Costa Rica', slug: 'costa-rica', flag: '🇨🇷', groupe: 'I',
    selectionneur: 'Luis Fernando Suárez', classementFIFA: 38,
    formation: '5-4-1',
    pointsForts: ['Expérience des grandes compétitions', 'Organisation défensive redoutable (quarts 2014)', 'Combativité'],
    pointsFaibles: ['Génération post-2014 moins talentueuse', 'Peu de joueurs évoluant en Europe', 'Offensivement limité'],
    ambitions: 'Retrouver les quarts de finale de 2014 et créer à nouveau la surprise'
  },
  // GROUPE J
  {
    pays: 'Croatia', slug: 'croatia', flag: '🇭🇷', groupe: 'J',
    selectionneur: 'Zlatko Dalić', classementFIFA: 11,
    formation: '4-3-3',
    pointsForts: ['Modrić, génie intemporel', 'Expérience (finaliste 2018, 3e 2022)', 'Solidité collective'],
    pointsFaibles: ['Génération sur le déclin', 'Modrić à 40 ans', 'Succession non assurée'],
    ambitions: 'Dernier tournoi pour Modrić — aller chercher un titre pour couronner la légende'
  },
  {
    pays: 'Cameroon', slug: 'cameroon', flag: '🇨🇲', groupe: 'J',
    selectionneur: 'Marc Brys', classementFIFA: 28,
    formation: '4-3-3',
    pointsForts: ['Zambo Anguissa, milieu élite', 'Aboubakar, finisseur redoutable', 'Lions Indomptables — caractère légendaire'],
    pointsFaibles: ['Irrégularité frustrant le talent disponible', 'Manque d\'homogénéité', 'Défense perfectible'],
    ambitions: 'Atteindre les quarts de finale pour la première fois depuis 1990'
  },
  {
    pays: 'Iran', slug: 'iran', flag: '🇮🇷', groupe: 'J',
    selectionneur: 'Jalal Talebi', classementFIFA: 27,
    formation: '4-2-3-1',
    pointsForts: ['Mehdi Taremi à l\'Inter Milan', 'Organisation collective solide', 'Expérience CdM (2018, 2022)'],
    pointsFaibles: ['Manque de profondeur offensive', 'Pression politique', 'Niveau limité hormis Taremi'],
    ambitions: 'Passer les poules pour la première fois dans l\'histoire iranienne'
  },
  // GROUPE K
  {
    pays: 'Italy', slug: 'italy', flag: '🇮🇹', groupe: 'K',
    selectionneur: 'Luciano Spalletti', classementFIFA: 10,
    formation: '4-3-3',
    pointsForts: ['Barella, milieu élite', 'Chiesa explosif', 'Solidité défensive historique'],
    pointsFaibles: ['Absence traumatisante en 2018 et 2022', 'Pression de remplir le vide', 'Équipe en reconstruction'],
    ambitions: 'Revenir enfin en CdM après deux absences consécutives et aller le plus loin possible'
  },
  {
    pays: 'Tunisia', slug: 'tunisia', flag: '🇹🇳', groupe: 'K',
    selectionneur: 'Montassar Losfar', classementFIFA: 47,
    formation: '4-2-3-1',
    pointsForts: ['Skhiri, milieu solide en Bundesliga', 'Organisation défensive', 'Esprit collectif'],
    pointsFaibles: ['Manque de créativité offensive', 'Peu de joueurs au niveau européen élite', 'Groupe difficile (Italie)'],
    ambitions: 'Sortir des poules pour la première fois depuis 1978'
  },
  {
    pays: 'Cuba', slug: 'cuba', flag: '🇨🇺', groupe: 'K',
    selectionneur: 'Marcos Roca', classementFIFA: 49,
    formation: '4-4-2',
    pointsForts: ['Qualification historique pour Cuba', 'Motivation maximale', 'Combativité'],
    pointsFaibles: ['Niveau très limité face aux nations mondiales', 'Peu d\'expérience internationale', 'Effectif évoluant surtout en MLS/Caraïbes'],
    ambitions: 'Vivre l\'expérience et pourquoi pas décrocher un point surprenant'
  },
  {
    pays: 'Indonesia', slug: 'indonesia', flag: '🇮🇩', groupe: 'K',
    selectionneur: 'Patrick Kluivert', classementFIFA: 50,
    formation: '4-2-3-1',
    pointsForts: ['Naturalisation de joueurs de haut niveau', 'Public de 280 millions de fans', 'Montée en puissance en AFC'],
    pointsFaibles: ['Niveau compétitif limité', 'Première CdM historique', 'Cohérence tactique à confirmer'],
    ambitions: 'Vivre un moment historique et créer la surprise dans ce groupe'
  },
  // GROUPE L
  {
    pays: 'Switzerland', slug: 'switzerland', flag: '🇨🇭', groupe: 'L',
    selectionneur: 'Murat Yakin', classementFIFA: 20,
    formation: '4-2-3-1',
    pointsForts: ['Xhaka, champion d\'Allemagne', 'Embolo efficace', 'Organisation irréprochable'],
    pointsFaibles: ['Plafond de verre en CdM (jamais au-delà des 8e)', 'Manque de stars offensives', 'Équipe parfois trop prudente'],
    ambitions: 'Enfin franchir les quarts de finale et écrire une nouvelle page suisse'
  },
  {
    pays: 'Serbia', slug: 'serbia', flag: '🇷🇸', groupe: 'L',
    selectionneur: 'Dragan Stojković', classementFIFA: 29,
    formation: '3-5-2',
    pointsForts: ['Vlahović, meilleur buteur de Serie A', 'Talent offensif naturel', 'Solidité défensive'],
    pointsFaibles: ['Manque de régularité dans les tournois', 'Dépendance à Vlahović', 'Collectif parfois trop individualiste'],
    ambitions: 'Atteindre les quarts de finale pour la première fois depuis 2010'
  },
  {
    pays: 'Algeria', slug: 'algeria', flag: '🇩🇿', groupe: 'L',
    selectionneur: 'Vladimir Petkovic', classementFIFA: 32,
    formation: '4-3-3',
    pointsForts: ['Riyad Mahrez, meilleur joueur africain de sa génération', 'Technique et créativité', 'Expérience CAN'],
    pointsFaibles: ['Irrégularité en CdM', 'Collectif parfois fragile sous pression', 'Défense vulnérable'],
    ambitions: 'Dépasser les 8e de finale et montrer que l\'Algérie a sa place au sommet'
  },
  {
    pays: 'Paraguay', slug: 'paraguay', flag: '🇵🇾', groupe: 'L',
    selectionneur: 'Gustavo Alfaro', classementFIFA: 39,
    formation: '4-4-2',
    pointsForts: ['Almirón infatigable', 'Combativité légendaire', 'Collectif soudé'],
    pointsFaibles: ['Manque de stars offensives', 'Qualification obtenue de justesse', 'Niveau limité face aux tops CONMEBOL'],
    ambitions: 'Créer la surprise et sortir des poules dans un groupe européen difficile'
  },
  // TURQUIE (joueur dans DB mais groupe à confirmer)
  {
    pays: 'Turkey', slug: 'turkey', flag: '🇹🇷', groupe: 'A',
    selectionneur: 'Vincenzo Montella', classementFIFA: 23,
    formation: '4-2-3-1',
    pointsForts: ['Arda Güler, prodige du Real Madrid', 'Çalhanoğlu, régisseur de l\'Inter', 'Jeu offensif séduisant'],
    pointsFaibles: ['Défense fragile', 'Irrégularité mentale', 'Pression de la performance'],
    ambitions: 'Confirmer le demi-finaliste Euro 2024 et atteindre les quarts de finale'
  },
  // DENMARK
  {
    pays: 'Denmark', slug: 'denmark', flag: '🇩🇰', groupe: 'K',
    selectionneur: 'Kasper Hjulmand', classementFIFA: 22,
    formation: '3-4-3',
    pointsForts: ['Eriksen de retour au top niveau', 'Højlund, futur meilleur attaquant danois', 'Collectif bien huilé'],
    pointsFaibles: ['Manque de profondeur offensive', 'Pression après le bon Euro 2020 (demi-finale)', 'Dépendance à Eriksen'],
    ambitions: 'Dépasser le stade des quarts de finale pour la première fois'
  },
  // POLAND
  {
    pays: 'Poland', slug: 'poland', flag: '🇵🇱', groupe: 'I',
    selectionneur: 'Michał Probierz', classementFIFA: 24,
    formation: '4-3-3',
    pointsForts: ['Lewandowski, toujours l\'un des meilleurs buteurs du monde', 'Solidité défensive', 'Expérience CdM'],
    pointsFaibles: ['Trop dépendant de Lewandowski', 'Milieu limité hors de la zone de but', 'Lewandowski à 37 ans'],
    ambitions: 'Sortir des poules et idéalement atteindre les quarts de finale'
  },
]
