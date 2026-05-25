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
  // ID API-Football v3 — utilisé pour fetch les stats temps réel pendant la CdM.
  // À vérifier via GET /teams?league=1&season=2026 si absent.
  apiFootballTeamId: number
}

export function pays2slug(pays: string): string {
  return pays.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
}

export function getTeamBySlug(slug: string): TeamProfile | undefined {
  return CDM_TEAM_PROFILES.find(t => t.slug === slug)
}

export const CDM_TEAM_PROFILES: TeamProfile[] = [

  // ══════════════════════════════════════════
  // GROUPE A : Mexico · South Korea · South Africa · Czechia
  // ══════════════════════════════════════════
  {
    pays: 'Mexico', slug: 'mexico', flag: '🇲🇽', groupe: 'A', apiFootballTeamId: 16,
    selectionneur: 'Javier Aguirre', classementFIFA: 15,
    formation: '4-3-3',
    pointsForts: ['Soutien du public (pays hôte)', 'Expérience des grandes compétitions', 'Solidité défensive'],
    pointsFaibles: ['Pression de jouer à domicile', 'Manque de profondeur offensive'],
    ambitions: 'Sortir des poules et franchir le cap des 8e de finale pour la première fois',
  },
  {
    pays: 'South Korea', slug: 'south-korea', flag: '🇰🇷', groupe: 'A', apiFootballTeamId: 17,
    selectionneur: 'Hong Myung-bo', classementFIFA: 17,
    formation: '4-2-3-1',
    pointsForts: ['Son Heung-min, star mondiale', 'Collectif bien organisé', 'Expérience des grandes compétitions'],
    pointsFaibles: ['Trop dépendant de Son', 'Milieu parfois dominé face aux tops'],
    ambitions: 'Retrouver les quarts de finale et égaler l\'exploit de 2002',
  },
  {
    pays: 'South Africa', slug: 'south-africa', flag: '🇿🇦', groupe: 'A', apiFootballTeamId: 1531,
    selectionneur: 'Hugo Broos', classementFIFA: 31,
    formation: '4-1-4-1',
    pointsForts: ['Percy Tau technique et expérimenté', 'Motivation du retour en CdM', 'Surprise potentielle'],
    pointsFaibles: ['Effectif limité', 'Peu de joueurs dans les top championnats', 'Groupe difficile'],
    ambitions: 'Créer la surprise et passer les poules pour la première fois depuis 2010',
  },
  {
    pays: 'Czechia', slug: 'czechia', flag: '🇨🇿', groupe: 'A', apiFootballTeamId: 770,
    selectionneur: 'Ivan Hašek', classementFIFA: 26,
    formation: '4-2-3-1',
    pointsForts: ['Schick, finisseur élite en Bundesliga', 'Organisation tactique solide', 'Expérience européenne'],
    pointsFaibles: ['Profondeur de l\'effectif limitée', 'Manque d\'expérience en CdM', 'Pression d\'un groupe compétitif'],
    ambitions: 'Passer les poules et confirmer la montée en puissance du football tchèque',
  },

  // ══════════════════════════════════════════
  // GROUPE B : Canada · Switzerland · Qatar · Bosnia-Herzegovina
  // ══════════════════════════════════════════
  {
    pays: 'Canada', slug: 'canada', flag: '🇨🇦', groupe: 'B', apiFootballTeamId: 5529,
    selectionneur: 'Jesse Marsch', classementFIFA: 27,
    formation: '4-3-3',
    pointsForts: ['Davies et David, génération talentueuse', 'Vitesse sur les ailes', 'Pays hôte — soutien public'],
    pointsFaibles: ['Pression de la première CdM à domicile', 'Manque d\'expérience au plus haut niveau'],
    ambitions: 'Atteindre les quarts de finale — tournoi historique pour le football canadien',
  },
  {
    pays: 'Switzerland', slug: 'switzerland', flag: '🇨🇭', groupe: 'B', apiFootballTeamId: 15,
    selectionneur: 'Murat Yakin', classementFIFA: 19,
    formation: '4-2-3-1',
    pointsForts: ['Xhaka, champion d\'Allemagne', 'Embolo efficace', 'Organisation irréprochable'],
    pointsFaibles: ['Plafond de verre en grandes compétitions', 'Manque de stars offensives'],
    ambitions: 'Franchir les quarts de finale et écrire une nouvelle page suisse',
  },
  {
    pays: 'Qatar', slug: 'qatar', flag: '🇶🇦', groupe: 'B', apiFootballTeamId: 1569,
    selectionneur: 'Marquez Lopez', classementFIFA: 39,
    formation: '3-5-2',
    pointsForts: ['Akram Afif, meilleur joueur Coupe d\'Asie', 'Organisation et discipline', 'Expérience de 2022'],
    pointsFaibles: ['Éliminé au 1er tour en 2022', 'Niveau global limité', 'Groupe difficile'],
    ambitions: 'Se qualifier pour les 8e et faire mieux qu\'en 2022',
  },
  {
    pays: 'Bosnia-Herzegovina', slug: 'bosnia-herzegovina', flag: '🇧🇦', groupe: 'B', apiFootballTeamId: 1113,
    selectionneur: 'Sergej Barbarez', classementFIFA: 36,
    formation: '4-2-3-1',
    pointsForts: ['Džeko toujours redoutable', 'Talent offensif naturel', 'Première CdM depuis 2014'],
    pointsFaibles: ['Génération transitoire', 'Irrégularité collective', 'Manque d\'expérience récente'],
    ambitions: 'Retrouver la scène mondiale et passer le premier tour pour la première fois',
  },

  // ══════════════════════════════════════════
  // GROUPE C : Brazil · Morocco · Scotland · Haiti
  // ══════════════════════════════════════════
  {
    pays: 'Brazil', slug: 'brazil', flag: '🇧🇷', groupe: 'C', apiFootballTeamId: 6,
    selectionneur: 'Dorival Júnior', classementFIFA: 6,
    formation: '4-2-3-1',
    pointsForts: ['Vinicius Jr., l\'un des meilleurs du monde', 'Créativité et talent offensif', 'Raphinha décisif'],
    pointsFaibles: ['Sans titre depuis 2002 — manque de sérénité', 'Défense perfectible'],
    ambitions: 'Mettre fin au jeûne de 24 ans et redevenir Hexacampeões',
  },
  {
    pays: 'Morocco', slug: 'morocco', flag: '🇲🇦', groupe: 'C', apiFootballTeamId: 31,
    selectionneur: 'Walid Regragui', classementFIFA: 8,
    formation: '4-3-3',
    pointsForts: ['Demi-finaliste 2022 (exploit historique)', 'Solidité défensive redoutable', 'Hakimi au sommet'],
    pointsFaibles: ['Dépendance aux performances individuelles', 'Niveau offensif parfois limité'],
    ambitions: 'Aller encore plus loin qu\'en 2022 et viser le dernier carré',
  },
  {
    pays: 'Scotland', slug: 'scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', groupe: 'C', apiFootballTeamId: 1108,
    selectionneur: 'Steve Clarke', classementFIFA: 27,
    formation: '3-4-3',
    pointsForts: ['Robertson et McTominay, élites européens', 'Pressing haut organisé', 'Esprit collectif fort'],
    pointsFaibles: ['Manque d\'expérience en CdM (absent depuis 1998)', 'Profondeur offensive limitée'],
    ambitions: 'Sortir des poules pour la première fois depuis des décennies',
  },
  {
    pays: 'Haiti', slug: 'haiti', flag: '🇭🇹', groupe: 'C', apiFootballTeamId: 2386,
    selectionneur: 'Marc Collat', classementFIFA: 43,
    formation: '4-4-2',
    pointsForts: ['Qualification historique', 'Combativité et passion', 'Effectif avec des joueurs en MLS/Europe'],
    pointsFaibles: ['Niveau global très limité face aux favoris', 'Peu d\'expérience internationale', 'Groupe très difficile'],
    ambitions: 'Vivre l\'histoire et créer une surprise',
  },

  // ══════════════════════════════════════════
  // GROUPE D : USA · Paraguay · Australia · Turkey
  // ══════════════════════════════════════════
  {
    pays: 'USA', slug: 'usa', flag: '🇺🇸', groupe: 'D', apiFootballTeamId: 2384,
    selectionneur: 'Mauricio Pochettino', classementFIFA: 16,
    formation: '4-3-3',
    pointsForts: ['Pulisic, Reyna, Adams — génération dorée', 'Soutien du public (pays hôte)', 'Athlétisme et pressing'],
    pointsFaibles: ['Pression d\'être pays hôte', 'Manque de régularité au plus haut niveau'],
    ambitions: 'Atteindre les quarts de finale et marquer l\'histoire du football américain',
  },
  {
    pays: 'Paraguay', slug: 'paraguay', flag: '🇵🇾', groupe: 'D', apiFootballTeamId: 2380,
    selectionneur: 'Gustavo Alfaro', classementFIFA: 33,
    formation: '4-4-2',
    pointsForts: ['Almirón infatigable', 'Combativité légendaire', 'Collectif soudé'],
    pointsFaibles: ['Manque de stars offensives', 'Niveau limité face aux tops CONMEBOL'],
    ambitions: 'Créer la surprise et sortir des poules',
  },
  {
    pays: 'Australia', slug: 'australia', flag: '🇦🇺', groupe: 'D', apiFootballTeamId: 20,
    selectionneur: 'Tony Popovic', classementFIFA: 30,
    formation: '4-2-3-1',
    pointsForts: ['Organisation collective', 'Expérience CdM 2022 (quarts de finale)', 'Solidité défensive'],
    pointsFaibles: ['Effectif moins profond', 'Distance géographique défavorable'],
    ambitions: 'Retrouver les quarts de finale comme en 2022',
  },
  {
    pays: 'Turkey', slug: 'turkey', flag: '🇹🇷', groupe: 'D', apiFootballTeamId: 777,
    selectionneur: 'Vincenzo Montella', classementFIFA: 20,
    formation: '4-2-3-1',
    pointsForts: ['Arda Güler, prodige du Real Madrid', 'Çalhanoğlu, régisseur de l\'Inter', 'Jeu offensif séduisant'],
    pointsFaibles: ['Défense fragile', 'Irrégularité mentale'],
    ambitions: 'Confirmer le demi-finaliste Euro 2024 et atteindre les quarts de finale',
  },

  // ══════════════════════════════════════════
  // GROUPE E : Germany · Ecuador · Ivory Coast · Curaçao
  // ══════════════════════════════════════════
  {
    pays: 'Germany', slug: 'germany', flag: '🇩🇪', groupe: 'E', apiFootballTeamId: 25,
    selectionneur: 'Julian Nagelsmann', classementFIFA: 10,
    formation: '4-2-3-1',
    pointsForts: ['Wirtz et Musiala, duo d\'exception', 'Collectif rodé', 'Expérience en grandes compétitions'],
    pointsFaibles: ['Défense parfois hésitante', 'Pression d\'une nation en reconstruction'],
    ambitions: 'Redevenir champions du monde après les déceptions de 2018 et 2022',
  },
  {
    pays: 'Ecuador', slug: 'ecuador', flag: '🇪🇨', groupe: 'E', apiFootballTeamId: 2382,
    selectionneur: 'Sebastián Beccacece', classementFIFA: 22,
    formation: '4-4-2',
    pointsForts: ['Caicedo, milieu de classe mondiale', 'Pressing intense', 'Cohésion collective'],
    pointsFaibles: ['Attaque trop dépendante de Valencia', 'Manque d\'expérience en phase finale'],
    ambitions: 'Passer les groupes et confirmer la montée en puissance',
  },
  {
    pays: 'Ivory Coast', slug: 'ivory-coast', flag: '🇨🇮', groupe: 'E', apiFootballTeamId: 1501,
    selectionneur: 'Emerse Faé', classementFIFA: 28,
    formation: '4-3-3',
    pointsForts: ['Champions d\'Afrique 2023', 'Zaha, Pépé, Gradel — talent offensif', 'Expérience des grandes compétitions africaines'],
    pointsFaibles: ['Irrégularité collective', 'Défense perfectible', 'Peu d\'expérience récente en CdM'],
    ambitions: 'Passer les poules et montrer que l\'Afrique peut rivaliser avec l\'Europe',
  },
  {
    pays: 'Curaçao', slug: 'curacao', flag: '🇨🇼', groupe: 'E', apiFootballTeamId: 5530,
    selectionneur: 'Remko Bicentini', classementFIFA: 44,
    formation: '4-4-2',
    pointsForts: ['Qualification CONCACAF historique', 'Joueurs naturalisés de talent', 'Combativité'],
    pointsFaibles: ['Premier WC de l\'histoire', 'Niveau global très limité', 'Groupe très difficile'],
    ambitions: 'Vivre la première CdM de l\'histoire de Curaçao et marquer les esprits',
  },

  // ══════════════════════════════════════════
  // GROUPE F : Netherlands · Japan · Tunisia · Sweden
  // ══════════════════════════════════════════
  {
    pays: 'Netherlands', slug: 'netherlands', flag: '🇳🇱', groupe: 'F', apiFootballTeamId: 1118,
    selectionneur: 'Ronald Koeman', classementFIFA: 7,
    formation: '4-3-3',
    pointsForts: ['Van Dijk, roc défensif', 'Gakpo et Xavi Simons redoutables', 'Héritage total football'],
    pointsFaibles: ['Manque de régularité dans les grands tournois', 'Dépendance à quelques individualités'],
    ambitions: 'Atteindre les demi-finales et retrouver les sommets',
  },
  {
    pays: 'Japan', slug: 'japan', flag: '🇯🇵', groupe: 'F', apiFootballTeamId: 12,
    selectionneur: 'Hajime Moriyasu', classementFIFA: 18,
    formation: '4-2-3-1',
    pointsForts: ['Kubo et Mitoma, élites européens', 'Discipline tactique parfaite', 'Collectif soudé'],
    pointsFaibles: ['Manque de physique face aux équipes européennes', 'Dernier carré jamais atteint'],
    ambitions: 'Atteindre les demi-finales pour la première fois de l\'histoire japonaise',
  },
  {
    pays: 'Tunisia', slug: 'tunisia', flag: '🇹🇳', groupe: 'F', apiFootballTeamId: 28,
    selectionneur: 'Montassar Losfar', classementFIFA: 34,
    formation: '4-2-3-1',
    pointsForts: ['Skhiri, milieu solide en Bundesliga', 'Organisation défensive', 'Esprit collectif'],
    pointsFaibles: ['Manque de créativité offensive', 'Groupe difficile (Pays-Bas, Japon)'],
    ambitions: 'Sortir des poules pour la première fois depuis 1978',
  },
  {
    pays: 'Sweden', slug: 'sweden', flag: '🇸🇪', groupe: 'F', apiFootballTeamId: 5,
    selectionneur: 'Jon Dahl Tomasson', classementFIFA: 24,
    formation: '4-4-2',
    pointsForts: ['Isak, attaquant élite en Premier League', 'Forsberg expérimenté', 'Organisation collective solide'],
    pointsFaibles: ['Après l\'ère Ibrahimovic — transition', 'Profondeur limitée', 'Groupe compétitif'],
    ambitions: 'Sortir des poules et retrouver la place de la Suède parmi les grandes nations',
  },

  // ══════════════════════════════════════════
  // GROUPE G : Belgium · Iran · Egypt · New Zealand
  // ══════════════════════════════════════════
  {
    pays: 'Belgium', slug: 'belgium', flag: '🇧🇪', groupe: 'G', apiFootballTeamId: 1,
    selectionneur: 'Rudi Garcia', classementFIFA: 9,
    formation: '3-4-3',
    pointsForts: ['De Bruyne, meilleur passeur du monde', 'Nouvelle génération (Doku, Trossard)', 'Expérience accumulée'],
    pointsFaibles: ['Génération en transition', 'Sans titre malgré les talents'],
    ambitions: 'Atteindre les demi-finales avec l\'ancienne et la nouvelle génération',
  },
  {
    pays: 'Iran', slug: 'iran', flag: '🇮🇷', groupe: 'G', apiFootballTeamId: 22,
    selectionneur: 'Amir Ghalenoei', classementFIFA: 32,
    formation: '4-2-3-1',
    pointsForts: ['Taremi à l\'Inter Milan', 'Organisation collective solide', 'Expérience CdM (2018, 2022)'],
    pointsFaibles: ['Manque de profondeur offensive', 'Niveau limité hormis Taremi'],
    ambitions: 'Passer les poules pour la première fois dans l\'histoire iranienne',
  },
  {
    pays: 'Egypt', slug: 'egypt', flag: '🇪🇬', groupe: 'G', apiFootballTeamId: 32,
    selectionneur: 'Hassan Kabrani', classementFIFA: 29,
    formation: '4-3-3',
    pointsForts: ['Mohamed Salah, l\'un des meilleurs du monde', 'Organisation défensive', 'Expérience CAN'],
    pointsFaibles: ['Trop dépendant de Salah', 'Salah approche de la fin de carrière'],
    ambitions: 'Offrir à Salah son premier grand titre international',
  },
  {
    pays: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿', groupe: 'G', apiFootballTeamId: 4673,
    selectionneur: 'Darren Bazeley', classementFIFA: 40,
    formation: '4-5-1',
    pointsForts: ['Chris Wood, buteur de Premier League', 'Solidité défensive', 'Qualification via OFC'],
    pointsFaibles: ['Niveau compétitif limité (confédération OFC)', 'Peu de joueurs élite'],
    ambitions: 'Sortir des poules pour la première fois dans l\'histoire des All Whites',
  },

  // ══════════════════════════════════════════
  // GROUPE H : Spain · Uruguay · Saudi Arabia · Cape Verde
  // ══════════════════════════════════════════
  {
    pays: 'Spain', slug: 'spain', flag: '🇪🇸', groupe: 'H', apiFootballTeamId: 9,
    selectionneur: 'Luis de la Fuente', classementFIFA: 2,
    formation: '4-3-3',
    pointsForts: ['Lamine Yamal, prodige de 18 ans', 'Jeu de possession total', 'Profondeur et qualité partout'],
    pointsFaibles: ['Pression après l\'Euro 2024', 'Morata pas toujours décisif'],
    ambitions: 'Remporter le titre mondial après l\'Euro 2024 — doublet historique',
  },
  {
    pays: 'Uruguay', slug: 'uruguay', flag: '🇺🇾', groupe: 'H', apiFootballTeamId: 7,
    selectionneur: 'Marcelo Bielsa', classementFIFA: 17,
    formation: '4-3-3',
    pointsForts: ['Darwin Núñez dévastateur', 'Caractère et résistance mentale', 'Expérience historique de la Celeste'],
    pointsFaibles: ['Effectif moins profond que les favoris', 'Défense vieillissante'],
    ambitions: 'Atteindre les quarts et surprendre l\'un des favoris',
  },
  {
    pays: 'Saudi Arabia', slug: 'saudi-arabia', flag: '🇸🇦', groupe: 'H', apiFootballTeamId: 23,
    selectionneur: 'Roberto Mancini', classementFIFA: 28,
    formation: '4-2-3-1',
    pointsForts: ['Al-Dawsari, héros du but contre l\'Argentine 2022', 'Jeu bien organisé', 'Saudi Pro League relevée'],
    pointsFaibles: ['Niveau global limité face aux tops', 'Groupe de la mort (Espagne, Uruguay)'],
    ambitions: 'Répéter la surprise de 2022 et sortir des poules',
  },
  {
    pays: 'Cape Verde', slug: 'cape-verde', flag: '🇨🇻', groupe: 'H', apiFootballTeamId: 1533,
    selectionneur: 'Bubista', classementFIFA: 42,
    formation: '4-3-3',
    pointsForts: ['Finaliste CAN 2023 (exploit historique)', 'Ryan Mendes créatif', 'Solidarité collective'],
    pointsFaibles: ['Niveau global limité', 'Groupe très difficile', 'Peu d\'expérience CdM'],
    ambitions: 'Créer la surprise dans un groupe difficile et écrire l\'histoire',
  },

  // ══════════════════════════════════════════
  // GROUPE I : France · Senegal · Norway · Iraq
  // ══════════════════════════════════════════
  {
    pays: 'France', slug: 'france', flag: '🇫🇷', groupe: 'I', apiFootballTeamId: 2,
    selectionneur: 'Didier Deschamps', classementFIFA: 1,
    formation: '4-3-3',
    pointsForts: ['Mbappé, meilleur joueur du monde', 'Profondeur de l\'effectif exceptionnelle', 'Finaliste 2022'],
    pointsFaibles: ['Pression médiatique intense', 'Instabilité dans les grandes compétitions'],
    ambitions: 'Aller chercher le troisième titre mondial après 1998 et 2018',
  },
  {
    pays: 'Senegal', slug: 'senegal', flag: '🇸🇳', groupe: 'I', apiFootballTeamId: 13,
    selectionneur: 'Aliou Cissé', classementFIFA: 14,
    formation: '4-3-3',
    pointsForts: ['Mané toujours décisif', 'Solidité collective', 'Athlétisme et physique'],
    pointsFaibles: ['Trop dépendant de Mané', 'Irrégularité offensive'],
    ambitions: 'Dépasser le stade des 8e de finale',
  },
  {
    pays: 'Norway', slug: 'norway', flag: '🇳🇴', groupe: 'I', apiFootballTeamId: 1090,
    selectionneur: 'Ståle Solbakken', classementFIFA: 23,
    formation: '4-3-3',
    pointsForts: ['Haaland, meilleur buteur du monde', 'Ødegaard, meneur de classe mondiale', 'Collectif ambitieux'],
    pointsFaibles: ['Première CdM depuis 1998 — manque d\'expérience', 'Pression autour de Haaland'],
    ambitions: 'Dépasser les poules grâce à Haaland et aller le plus loin possible',
  },
  {
    pays: 'Iraq', slug: 'iraq', flag: '🇮🇶', groupe: 'I', apiFootballTeamId: 1567,
    selectionneur: 'Jesús Casas', classementFIFA: 38,
    formation: '4-4-2',
    pointsForts: ['Qualification historique pour une CdM', 'Soutien populaire immense', 'Combativité'],
    pointsFaibles: ['Niveau très limité face aux top nations', 'Groupe très difficile (France, Norvège)'],
    ambitions: 'Vivre l\'expérience et tenter de décrocher au moins un point',
  },

  // ══════════════════════════════════════════
  // GROUPE J : Argentina · Austria · Algeria · Jordan
  // ══════════════════════════════════════════
  {
    pays: 'Argentina', slug: 'argentina', flag: '🇦🇷', groupe: 'J', apiFootballTeamId: 26,
    selectionneur: 'Lionel Scaloni', classementFIFA: 3,
    formation: '4-3-3',
    pointsForts: ['Messi, champion du monde en titre', 'Collectif soudé et champion', 'Álvarez et Lautaro en feu'],
    pointsFaibles: ['Messi proche de la retraite', 'Après le titre, motivation à confirmer'],
    ambitions: 'Défendre le titre et offrir à Messi un dernier sacre en apothéose',
  },
  {
    pays: 'Austria', slug: 'austria', flag: '🇦🇹', groupe: 'J', apiFootballTeamId: 775,
    selectionneur: 'Ralf Rangnick', classementFIFA: 21,
    formation: '4-3-3',
    pointsForts: ['Alaba (retour espéré)', 'Sabitzer et Laimer, milieu de classe mondiale', 'Pressing intense Rangnick-style'],
    pointsFaibles: ['Manque d\'expérience CdM', 'Groupe de la mort (Argentine)'],
    ambitions: 'Passer les poules pour la première fois depuis 1990',
  },
  {
    pays: 'Algeria', slug: 'algeria', flag: '🇩🇿', groupe: 'J', apiFootballTeamId: 1532,
    selectionneur: 'Vladimir Petkovic', classementFIFA: 25,
    formation: '4-3-3',
    pointsForts: ['Mahrez, meilleur joueur africain de sa génération', 'Technique et créativité', 'Champion d\'Afrique 2019'],
    pointsFaibles: ['Irrégularité en CdM', 'Collectif parfois fragile', 'Défense vulnérable'],
    ambitions: 'Dépasser les 8e de finale et montrer que l\'Algérie a sa place au sommet',
  },
  {
    pays: 'Jordan', slug: 'jordan', flag: '🇯🇴', groupe: 'J', apiFootballTeamId: 1548,
    selectionneur: 'Hussein Ammouta', classementFIFA: 37,
    formation: '4-4-2',
    pointsForts: ['Finaliste Coupe d\'Asie 2023 (exploit)', 'Organisation défensive', 'Progrès constants'],
    pointsFaibles: ['Première CdM de l\'histoire', 'Groupe très difficile (Argentine)', 'Manque de stars offensives'],
    ambitions: 'Écrire l\'histoire jordanienne en participant au premier Mondial',
  },

  // ══════════════════════════════════════════
  // GROUPE K : Portugal · Colombia · Uzbekistan · DR Congo
  // ══════════════════════════════════════════
  {
    pays: 'Portugal', slug: 'portugal', flag: '🇵🇹', groupe: 'K', apiFootballTeamId: 27,
    selectionneur: 'Roberto Martínez', classementFIFA: 5,
    formation: '4-2-3-1',
    pointsForts: ['Bruno Fernandes maestro du jeu', 'Leão et Bernardo Silva brillants', 'Génération post-Ronaldo talentueuse'],
    pointsFaibles: ['Transition post-CR7 à confirmer', 'Défense parfois fragile'],
    ambitions: 'Remporter le premier titre mondial portugais',
  },
  {
    pays: 'Colombia', slug: 'colombia', flag: '🇨🇴', groupe: 'K', apiFootballTeamId: 8,
    selectionneur: 'Néstor Lorenzo', classementFIFA: 13,
    formation: '4-3-3',
    pointsForts: ['Luis Díaz explosif', 'James Rodríguez en fin de carrière brillante', 'Copa América 2024'],
    pointsFaibles: ['Défense fragile', 'Dépendance au génie individuel'],
    ambitions: 'Retrouver les quarts de finale et confirmer le titre Copa América 2024',
  },
  {
    pays: 'Uzbekistan', slug: 'uzbekistan', flag: '🇺🇿', groupe: 'K', apiFootballTeamId: 1568,
    selectionneur: 'Srecko Katanec', classementFIFA: 35,
    formation: '4-4-2',
    pointsForts: ['Qualification historique', 'Shomurodov expérimenté en Serie A', 'Cohésion collective'],
    pointsFaibles: ['Premier WC — manque d\'expérience', 'Groupe difficile (Portugal, Colombie)'],
    ambitions: 'Vivre la première CdM et créer la surprise',
  },
  {
    pays: 'DR Congo', slug: 'dr-congo', flag: '🇨🇩', groupe: 'K', apiFootballTeamId: 1508,
    selectionneur: 'Sébastien Desabre', classementFIFA: 41,
    formation: '4-3-3',
    pointsForts: ['Bakambu expérimenté', 'Athlétisme naturel', 'Talent offensif brut'],
    pointsFaibles: ['Effectif limité', 'Peu d\'expérience en CdM'],
    ambitions: 'Marquer l\'histoire et créer une surprise',
  },

  // ══════════════════════════════════════════
  // GROUPE L : England · Croatia · Panama · Ghana
  // ══════════════════════════════════════════
  {
    pays: 'England', slug: 'england', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupe: 'L', apiFootballTeamId: 10,
    selectionneur: 'Thomas Tuchel', classementFIFA: 4,
    formation: '4-3-3',
    pointsForts: ['Bellingham et Kane, duo d\'exception', 'Profondeur de l\'effectif', 'Premier League — meilleur championnat'],
    pointsFaibles: ['Pression du titre toujours absent depuis 1966', 'Tirs aux buts catastrophiques'],
    ambitions: '60 ans d\'attente — remporter enfin le premier titre mondial anglais',
  },
  {
    pays: 'Croatia', slug: 'croatia', flag: '🇭🇷', groupe: 'L', apiFootballTeamId: 3,
    selectionneur: 'Zlatko Dalić', classementFIFA: 11,
    formation: '4-3-3',
    pointsForts: ['Modrić, génie intemporel', 'Expérience (finaliste 2018, 3e 2022)', 'Collectif solide'],
    pointsFaibles: ['Génération sur le déclin', 'Modrić à 40 ans', 'Succession non assurée'],
    ambitions: 'Dernier tournoi pour Modrić — aller chercher un titre pour couronner la légende',
  },
  {
    pays: 'Panama', slug: 'panama', flag: '🇵🇦', groupe: 'L', apiFootballTeamId: 11,
    selectionneur: 'Thomas Christiansen', classementFIFA: 38,
    formation: '5-4-1',
    pointsForts: ['Organisation défensive solide', 'Expérience CONCACAF', 'Combativité'],
    pointsFaibles: ['Manque de qualité offensive', 'Niveau limité face aux tops'],
    ambitions: 'Se qualifier pour les 8e et écrire une nouvelle page panaméenne',
  },
  {
    pays: 'Ghana', slug: 'ghana', flag: '🇬🇭', groupe: 'L', apiFootballTeamId: 1504,
    selectionneur: 'Otto Addo', classementFIFA: 32,
    formation: '4-2-3-1',
    pointsForts: ['Kudus, l\'une des révélations africaines', 'Talent offensif naturel', 'Expérience CdM (2006, 2010, 2014, 2022)'],
    pointsFaibles: ['Irrégularité chronique', 'Organisation défensive perfectible'],
    ambitions: 'Atteindre les quarts de finale comme en 2010 et réécrire l\'histoire africaine',
  },
]
