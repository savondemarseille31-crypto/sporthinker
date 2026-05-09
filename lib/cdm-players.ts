export type Player = {
  id: number
  nom: string
  pays: string
  flag: string
  groupe: string
  poste: string
  club: string
  age: number
  buts: number
  passes: number
  xG: number
  xA: number
  matchsJoues: number
  minutesJouees: number
  tirs: number
  note: number
  forme: string[]
  description: string
}

export const CDM_PLAYERS: Player[] = [
  // FRANCE
  { id: 1, nom: 'Kylian Mbappé', pays: 'France', flag: '🇫🇷', groupe: 'D', poste: 'Attaquant', club: 'Real Madrid', age: 27, buts: 31, passes: 12, xG: 27.4, xA: 9.8, matchsJoues: 38, minutesJouees: 3290, tirs: 142, note: 8.4, forme: ['V', 'V', 'V', 'N', 'V'], description: 'Capitaine des Bleus, meilleur buteur de Liga cette saison.' },
  { id: 2, nom: 'Antoine Griezmann', pays: 'France', flag: '🇫🇷', groupe: 'D', poste: 'Milieu offensif', club: 'Atletico Madrid', age: 35, buts: 18, passes: 14, xG: 16.2, xA: 11.3, matchsJoues: 36, minutesJouees: 2980, tirs: 89, note: 7.9, forme: ['V', 'N', 'V', 'V', 'N'], description: 'Maestro du jeu français, toujours décisif dans les grands matchs.' },
  // ARGENTINA
  { id: 3, nom: 'Lionel Messi', pays: 'Argentina', flag: '🇦🇷', groupe: 'F', poste: 'Attaquant', club: 'Inter Miami', age: 38, buts: 22, passes: 18, xG: 18.9, xA: 16.4, matchsJoues: 31, minutesJouees: 2650, tirs: 98, note: 8.6, forme: ['V', 'V', 'N', 'V', 'V'], description: 'Champion du monde en titre, la légende vivante du football.' },
  { id: 4, nom: 'Julián Álvarez', pays: 'Argentina', flag: '🇦🇷', groupe: 'F', poste: 'Attaquant', club: 'Atletico Madrid', age: 25, buts: 27, passes: 9, xG: 23.1, xA: 7.2, matchsJoues: 38, minutesJouees: 3180, tirs: 118, note: 8.1, forme: ['V', 'V', 'V', 'P', 'V'], description: 'Révélation du mondial 2022, désormais incontournable de l\'Albiceleste.' },
  // BRAZIL
  { id: 5, nom: 'Vinicius Jr', pays: 'Brazil', flag: '🇧🇷', groupe: 'G', poste: 'Ailier', club: 'Real Madrid', age: 24, buts: 26, passes: 16, xG: 21.8, xA: 13.9, matchsJoues: 36, minutesJouees: 3050, tirs: 124, note: 8.5, forme: ['V', 'V', 'V', 'V', 'N'], description: 'Ballon d\'Or en vue, l\'arme fatale de la Seleção.' },
  { id: 6, nom: 'Rodrygo', pays: 'Brazil', flag: '🇧🇷', groupe: 'G', poste: 'Ailier', club: 'Real Madrid', age: 24, buts: 19, passes: 13, xG: 16.4, xA: 11.2, matchsJoues: 37, minutesJouees: 2890, tirs: 94, note: 7.8, forme: ['V', 'N', 'V', 'V', 'V'], description: 'Décisif dans les grands moments, partenaire redoutable de Vinicius.' },
  // SPAIN
  { id: 7, nom: 'Pedri', pays: 'Spain', flag: '🇪🇸', groupe: 'G', poste: 'Milieu', club: 'Barcelona', age: 23, buts: 12, passes: 19, xG: 10.1, xA: 16.8, matchsJoues: 35, minutesJouees: 2980, tirs: 67, note: 8.2, forme: ['V', 'V', 'N', 'V', 'V'], description: 'Le cerveau de la Roja, maestro de la possession.' },
  { id: 8, nom: 'Lamine Yamal', pays: 'Spain', flag: '🇪🇸', groupe: 'G', poste: 'Ailier', club: 'Barcelona', age: 18, buts: 21, passes: 24, xG: 17.3, xA: 20.1, matchsJoues: 38, minutesJouees: 3120, tirs: 108, note: 8.7, forme: ['V', 'V', 'V', 'V', 'V'], description: 'Phénomène de 18 ans, déjà l\'un des meilleurs au monde.' },
  // ENGLAND
  { id: 9, nom: 'Jude Bellingham', pays: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupe: 'H', poste: 'Milieu offensif', club: 'Real Madrid', age: 21, buts: 23, passes: 17, xG: 19.8, xA: 14.3, matchsJoues: 37, minutesJouees: 3240, tirs: 112, note: 8.4, forme: ['V', 'V', 'V', 'N', 'V'], description: 'Le joueur le plus complet de sa génération.' },
  { id: 10, nom: 'Harry Kane', pays: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupe: 'H', poste: 'Attaquant', club: 'Bayern Munich', age: 31, buts: 36, passes: 11, xG: 31.2, xA: 9.4, matchsJoues: 38, minutesJouees: 3380, tirs: 168, note: 8.3, forme: ['V', 'V', 'N', 'V', 'V'], description: 'Meilleur buteur de Bundesliga, machine à buts inépuisable.' },
  // PORTUGAL
  { id: 11, nom: 'Cristiano Ronaldo', pays: 'Portugal', flag: '🇵🇹', groupe: 'F', poste: 'Attaquant', club: 'Al-Nassr', age: 41, buts: 38, passes: 6, xG: 29.8, xA: 4.1, matchsJoues: 34, minutesJouees: 2940, tirs: 178, note: 7.6, forme: ['V', 'V', 'V', 'N', 'V'], description: 'Dernière CdM pour la légende portugaise, toujours affamé de buts.' },
  { id: 12, nom: 'Bruno Fernandes', pays: 'Portugal', flag: '🇵🇹', groupe: 'F', poste: 'Milieu offensif', club: 'Manchester United', age: 30, buts: 16, passes: 21, xG: 13.4, xA: 18.9, matchsJoues: 37, minutesJouees: 3190, tirs: 98, note: 8.0, forme: ['V', 'N', 'V', 'V', 'N'], description: 'Le vrai patron du Portugal, créateur hors pair.' },
  // GERMANY
  { id: 13, nom: 'Florian Wirtz', pays: 'Germany', flag: '🇩🇪', groupe: 'E', poste: 'Milieu offensif', club: 'Bayer Leverkusen', age: 22, buts: 18, passes: 22, xG: 14.9, xA: 19.3, matchsJoues: 36, minutesJouees: 2980, tirs: 89, note: 8.3, forme: ['V', 'V', 'V', 'V', 'N'], description: 'La nouvelle star allemande, technique et vision de jeu exceptionnelles.' },
  { id: 14, nom: 'Jamal Musiala', pays: 'Germany', flag: '🇩🇪', groupe: 'E', poste: 'Milieu offensif', club: 'Bayern Munich', age: 22, buts: 21, passes: 18, xG: 17.8, xA: 15.6, matchsJoues: 37, minutesJouees: 3100, tirs: 103, note: 8.2, forme: ['V', 'N', 'V', 'V', 'V'], description: 'Dribbleur d\'élite, danger permanent pour toute défense.' },
  // MOROCCO
  { id: 15, nom: 'Achraf Hakimi', pays: 'Morocco', flag: '🇲🇦', groupe: 'D', poste: 'Défenseur', club: 'PSG', age: 26, buts: 8, passes: 16, xG: 6.2, xA: 13.4, matchsJoues: 36, minutesJouees: 3150, tirs: 48, note: 7.9, forme: ['V', 'V', 'N', 'V', 'V'], description: 'Meilleur latéral droit du monde, redoutable dans les deux surfaces.' },
  // NETHERLANDS
  { id: 16, nom: 'Virgil van Dijk', pays: 'Netherlands', flag: '🇳🇱', groupe: 'H', poste: 'Défenseur', club: 'Liverpool', age: 33, buts: 4, passes: 3, xG: 3.8, xA: 2.1, matchsJoues: 34, minutesJouees: 3060, tirs: 22, note: 7.8, forme: ['V', 'V', 'V', 'N', 'V'], description: 'Roc défensif, patron de la charnière néerlandaise.' },
  // SENEGAL
  { id: 17, nom: 'Sadio Mané', pays: 'Senegal', flag: '🇸🇳', groupe: 'D', poste: 'Attaquant', club: 'Al-Nassr', age: 34, buts: 24, passes: 10, xG: 20.3, xA: 8.7, matchsJoues: 33, minutesJouees: 2780, tirs: 98, note: 7.7, forme: ['V', 'N', 'V', 'V', 'N'], description: 'Leader des Lions de la Téranga, toujours aussi dangereux.' },
  // USA
  { id: 18, nom: 'Christian Pulisic', pays: 'USA', flag: '🇺🇸', groupe: 'B', poste: 'Ailier', club: 'AC Milan', age: 27, buts: 14, passes: 11, xG: 11.8, xA: 9.4, matchsJoues: 35, minutesJouees: 2890, tirs: 78, note: 7.6, forme: ['V', 'V', 'N', 'N', 'V'], description: 'Captain America, la plus grande star du football US.' },
  // JAPAN
  { id: 19, nom: 'Takefusa Kubo', pays: 'Japan', flag: '🇯🇵', groupe: 'E', poste: 'Ailier', club: 'Real Sociedad', age: 23, buts: 16, passes: 13, xG: 13.2, xA: 11.0, matchsJoues: 36, minutesJouees: 2940, tirs: 84, note: 7.7, forme: ['V', 'V', 'N', 'V', 'V'], description: 'La surprise japonaise, capable de déstabiliser n\'importe quelle défense.' },
  // COLOMBIA
  { id: 20, nom: 'Luis Díaz', pays: 'Colombia', flag: '🇨🇴', groupe: 'E', poste: 'Ailier', club: 'Liverpool', age: 28, buts: 18, passes: 12, xG: 15.3, xA: 10.2, matchsJoues: 37, minutesJouees: 3050, tirs: 94, note: 7.9, forme: ['V', 'V', 'V', 'N', 'V'], description: 'Explosif et imprévisible, la principale menace colombienne.' },
]

// ESPAGNE
export const EXTRA_PLAYERS: Player[] = [
  { id: 21, nom: 'Dani Olmo', pays: 'Spain', flag: '🇪🇸', groupe: 'G', poste: 'Milieu offensif', club: 'Barcelona', age: 26, buts: 14, passes: 16, xG: 12.1, xA: 13.8, matchsJoues: 34, minutesJouees: 2780, tirs: 72, note: 8.0, forme: ['V','V','N','V','V'], description: 'Polyvalent et technique, pièce maîtresse du milieu espagnol.' },
  { id: 22, nom: 'Álvaro Morata', pays: 'Spain', flag: '🇪🇸', groupe: 'G', poste: 'Attaquant', club: 'AC Milan', age: 32, buts: 19, passes: 8, xG: 17.2, xA: 6.4, matchsJoues: 36, minutesJouees: 2950, tirs: 98, note: 7.7, forme: ['V','N','V','V','P'], description: 'Capitaine de la Roja, toujours décisif dans les moments importants.' },
  // BRAZIL
  { id: 23, nom: 'Endrick', pays: 'Brazil', flag: '🇧🇷', groupe: 'G', poste: 'Attaquant', club: 'Real Madrid', age: 18, buts: 14, passes: 5, xG: 11.8, xA: 3.9, matchsJoues: 28, minutesJouees: 1840, tirs: 68, note: 7.5, forme: ['V','V','N','V','V'], description: 'Pépite brésilienne de 18 ans, déjà redoutable devant le but.' },
  { id: 24, nom: 'Raphinha', pays: 'Brazil', flag: '🇧🇷', groupe: 'G', poste: 'Ailier', club: 'Barcelona', age: 28, buts: 22, passes: 19, xG: 18.4, xA: 16.2, matchsJoues: 37, minutesJouees: 3080, tirs: 112, note: 8.1, forme: ['V','V','V','N','V'], description: 'En feu cette saison avec le Barça, l\'un des meilleurs ailiers du monde.' },
  // FRANCE
  { id: 25, nom: 'Ousmane Dembélé', pays: 'France', flag: '🇫🇷', groupe: 'D', poste: 'Ailier', club: 'PSG', age: 28, buts: 16, passes: 21, xG: 13.2, xA: 18.9, matchsJoues: 35, minutesJouees: 2890, tirs: 88, note: 7.9, forme: ['V','N','V','V','V'], description: 'Dribbleur hors norme, créateur de différences constantes.' },
  { id: 26, nom: 'Marcus Thuram', pays: 'France', flag: '🇫🇷', groupe: 'D', poste: 'Attaquant', club: 'Inter Milan', age: 27, buts: 24, passes: 11, xG: 20.8, xA: 9.1, matchsJoues: 37, minutesJouees: 3150, tirs: 108, note: 8.0, forme: ['V','V','V','P','V'], description: 'Puissant et technique, l\'un des meilleurs avant-centres d\'Europe.' },
  // ARGENTINA
  { id: 27, nom: 'Rodrigo De Paul', pays: 'Argentina', flag: '🇦🇷', groupe: 'F', poste: 'Milieu', club: 'Atletico Madrid', age: 31, buts: 8, passes: 14, xG: 6.8, xA: 12.1, matchsJoues: 36, minutesJouees: 3020, tirs: 52, note: 7.6, forme: ['V','N','V','V','N'], description: 'Poumon du milieu argentin, indispensable à l\'équilibre de l\'Albiceleste.' },
  { id: 28, nom: 'Lautaro Martínez', pays: 'Argentina', flag: '🇦🇷', groupe: 'F', poste: 'Attaquant', club: 'Inter Milan', age: 27, buts: 28, passes: 9, xG: 24.3, xA: 7.8, matchsJoues: 37, minutesJouees: 3200, tirs: 124, note: 8.2, forme: ['V','V','V','V','N'], description: 'Buteur prolifique de Serie A, en grande forme avant la CdM.' },
  // PORTUGAL
  { id: 29, nom: 'Rafael Leão', pays: 'Portugal', flag: '🇵🇹', groupe: 'F', poste: 'Ailier', club: 'AC Milan', age: 25, buts: 17, passes: 14, xG: 14.3, xA: 11.8, matchsJoues: 35, minutesJouees: 2840, tirs: 92, note: 7.8, forme: ['V','V','N','V','V'], description: 'Vitesse et technique, le danger principal de l\'aile gauche portugaise.' },
  { id: 30, nom: 'Bernardo Silva', pays: 'Portugal', flag: '🇵🇹', groupe: 'F', poste: 'Milieu offensif', club: 'Manchester City', age: 30, buts: 12, passes: 18, xG: 10.2, xA: 15.6, matchsJoues: 36, minutesJouees: 3010, tirs: 74, note: 8.1, forme: ['V','V','V','N','V'], description: 'Intelligence de jeu rare, le chef d\'orchestre de l\'équipe nationale.' },
  // GERMANY
  { id: 31, nom: 'Kai Havertz', pays: 'Germany', flag: '🇩🇪', groupe: 'E', poste: 'Attaquant', club: 'Arsenal', age: 26, buts: 19, passes: 12, xG: 16.8, xA: 10.4, matchsJoues: 36, minutesJouees: 2980, tirs: 94, note: 7.8, forme: ['V','N','V','V','V'], description: 'Polyvalent et technique, capable de jouer à plusieurs postes.' },
  { id: 32, nom: 'Thomas Müller', pays: 'Germany', flag: '🇩🇪', groupe: 'E', poste: 'Milieu offensif', club: 'Bayern Munich', age: 36, buts: 10, passes: 16, xG: 9.2, xA: 14.8, matchsJoues: 32, minutesJouees: 2410, tirs: 58, note: 7.5, forme: ['V','V','N','V','N'], description: 'Légende vivante, son intelligence de jeu reste précieuse.' },
  // ENGLAND
  { id: 33, nom: 'Phil Foden', pays: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupe: 'H', poste: 'Milieu offensif', club: 'Manchester City', age: 26, buts: 18, passes: 16, xG: 15.4, xA: 13.9, matchsJoues: 36, minutesJouees: 2960, tirs: 96, note: 8.1, forme: ['V','V','V','V','N'], description: 'Créatif et imprévisible, l\'un des meilleurs joueurs de Premier League.' },
  { id: 34, nom: 'Bukayo Saka', pays: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupe: 'H', poste: 'Ailier', club: 'Arsenal', age: 23, buts: 16, passes: 19, xG: 13.8, xA: 16.4, matchsJoues: 37, minutesJouees: 3140, tirs: 86, note: 8.0, forme: ['V','N','V','V','V'], description: 'Régularité et impact, indispensable de l\'équipe d\'Angleterre.' },
  // NETHERLANDS
  { id: 35, nom: 'Cody Gakpo', pays: 'Netherlands', flag: '🇳🇱', groupe: 'H', poste: 'Attaquant', club: 'Liverpool', age: 26, buts: 21, passes: 13, xG: 18.2, xA: 11.4, matchsJoues: 37, minutesJouees: 3050, tirs: 104, note: 7.9, forme: ['V','V','V','N','V'], description: 'Polyvalent et efficace, révélation de Liverpool cette saison.' },
  { id: 36, nom: 'Memphis Depay', pays: 'Netherlands', flag: '🇳🇱', groupe: 'H', poste: 'Attaquant', club: 'Atletico Madrid', age: 31, buts: 18, passes: 10, xG: 15.8, xA: 8.6, matchsJoues: 33, minutesJouees: 2680, tirs: 94, note: 7.6, forme: ['V','N','V','V','P'], description: 'Expérimenté et décisif, leader offensif des Pays-Bas.' },
  // MOROCCO
  { id: 37, nom: 'Hakim Ziyech', pays: 'Morocco', flag: '🇲🇦', groupe: 'D', poste: 'Ailier', club: 'Galatasaray', age: 32, buts: 14, passes: 16, xG: 11.6, xA: 13.8, matchsJoues: 34, minutesJouees: 2790, tirs: 78, note: 7.7, forme: ['V','V','N','V','V'], description: 'Technique et créatif, la pièce maîtresse du Maroc.' },
  { id: 38, nom: 'Youssef En-Nesyri', pays: 'Morocco', flag: '🇲🇦', groupe: 'D', poste: 'Attaquant', club: 'Fenerbahce', age: 28, buts: 22, passes: 6, xG: 19.4, xA: 4.8, matchsJoues: 35, minutesJouees: 2940, tirs: 102, note: 7.8, forme: ['V','V','V','N','V'], description: 'Buteur prolifique, très fort dans le jeu aérien.' },
  // BELGIUM
  { id: 39, nom: 'Kevin De Bruyne', pays: 'Belgium', flag: '🇧🇪', groupe: 'I', poste: 'Milieu offensif', club: 'Manchester City', age: 34, buts: 9, passes: 22, xG: 7.8, xA: 19.4, matchsJoues: 31, minutesJouees: 2540, tirs: 58, note: 8.2, forme: ['V','V','N','V','V'], description: 'Meilleur passeur du monde quand il est en forme, décisif en CdM.' },
  { id: 40, nom: 'Romelu Lukaku', pays: 'Belgium', flag: '🇧🇪', groupe: 'I', poste: 'Attaquant', club: 'Napoli', age: 31, buts: 26, passes: 8, xG: 22.6, xA: 6.2, matchsJoues: 35, minutesJouees: 2980, tirs: 118, note: 7.8, forme: ['V','V','V','V','N'], description: 'Machine à buts, terrifiant physiquement et techniquement.' },
  // USA
  { id: 41, nom: 'Gio Reyna', pays: 'USA', flag: '🇺🇸', groupe: 'B', poste: 'Milieu offensif', club: 'Borussia Dortmund', age: 22, buts: 10, passes: 14, xG: 8.4, xA: 12.1, matchsJoues: 32, minutesJouees: 2480, tirs: 64, note: 7.4, forme: ['V','N','V','V','N'], description: 'Talent générationnel américain, créatif et technique.' },
  { id: 42, nom: 'Tyler Adams', pays: 'USA', flag: '🇺🇸', groupe: 'B', poste: 'Milieu', club: 'Bournemouth', age: 26, buts: 3, passes: 8, xG: 2.8, xA: 7.2, matchsJoues: 34, minutesJouees: 2910, tirs: 28, note: 7.3, forme: ['V','V','N','V','V'], description: 'Capitaine des USA, récupérateur infatigable.' },
  // JAPAN
  { id: 43, nom: 'Wataru Endo', pays: 'Japan', flag: '🇯🇵', groupe: 'E', poste: 'Milieu', club: 'Liverpool', age: 31, buts: 4, passes: 7, xG: 3.4, xA: 6.1, matchsJoues: 35, minutesJouees: 2980, tirs: 32, note: 7.4, forme: ['V','N','V','V','V'], description: 'Patron du milieu japonais, leadership et solidité.' },
  { id: 44, nom: 'Kaoru Mitoma', pays: 'Japan', flag: '🇯🇵', groupe: 'E', poste: 'Ailier', club: 'Brighton', age: 27, buts: 14, passes: 11, xG: 11.8, xA: 9.4, matchsJoues: 36, minutesJouees: 2840, tirs: 84, note: 7.6, forme: ['V','V','V','N','V'], description: 'Dribbleur exceptionnel, capable de déstabiliser n\'importe quelle défense.' },
  // SENEGAL
  { id: 45, nom: 'Ismaïla Sarr', pays: 'Senegal', flag: '🇸🇳', groupe: 'D', poste: 'Ailier', club: 'Crystal Palace', age: 27, buts: 12, passes: 9, xG: 10.2, xA: 7.8, matchsJoues: 35, minutesJouees: 2760, tirs: 74, note: 7.4, forme: ['N','V','V','V','N'], description: 'Rapide et technique, danger permanent sur son côté.' },
  // COLOMBIA
  { id: 46, nom: 'James Rodríguez', pays: 'Colombia', flag: '🇨🇴', groupe: 'E', poste: 'Milieu offensif', club: 'Rayo Vallecano', age: 33, buts: 11, passes: 18, xG: 9.4, xA: 15.8, matchsJoues: 33, minutesJouees: 2680, tirs: 68, note: 7.6, forme: ['V','V','N','V','V'], description: 'Légende colombienne, toujours capable de performances magiques.' },
  // CROATIA
  { id: 47, nom: 'Luka Modrić', pays: 'Croatia', flag: '🇭🇷', groupe: 'J', poste: 'Milieu', club: 'Real Madrid', age: 40, buts: 6, passes: 14, xG: 5.2, xA: 12.4, matchsJoues: 30, minutesJouees: 2280, tirs: 48, note: 7.8, forme: ['V','N','V','V','V'], description: 'Dernière CdM pour la légende croate, toujours magistral.' },
  { id: 48, nom: 'Ivan Perišić', pays: 'Croatia', flag: '🇭🇷', groupe: 'J', poste: 'Ailier', club: 'Hajduk Split', age: 36, buts: 9, passes: 11, xG: 7.8, xA: 9.6, matchsJoues: 28, minutesJouees: 2240, tirs: 56, note: 7.3, forme: ['V','V','N','N','V'], description: 'Vétéran expérimenté, décisif dans les grands matchs.' },
  // SWITZERLAND
  { id: 49, nom: 'Granit Xhaka', pays: 'Switzerland', flag: '🇨🇭', groupe: 'L', poste: 'Milieu', club: 'Bayer Leverkusen', age: 32, buts: 8, passes: 12, xG: 6.8, xA: 10.4, matchsJoues: 35, minutesJouees: 3050, tirs: 54, note: 7.7, forme: ['V','V','V','N','V'], description: 'Leader et patron de la Nati, champion d\'Allemagne.' },
  { id: 50, nom: 'Breel Embolo', pays: 'Switzerland', flag: '🇨🇭', groupe: 'L', poste: 'Attaquant', club: 'Monaco', age: 28, buts: 16, passes: 7, xG: 13.8, xA: 5.6, matchsJoues: 34, minutesJouees: 2680, tirs: 84, note: 7.5, forme: ['V','N','V','V','V'], description: 'Puissant et efficace, référence offensive de la Suisse.' },
  // MEXICO
  { id: 51, nom: 'Hirving Lozano', pays: 'Mexico', flag: '🇲🇽', groupe: 'A', poste: 'Ailier', club: 'PSV Eindhoven', age: 30, buts: 18, passes: 12, xG: 15.2, xA: 10.4, matchsJoues: 36, minutesJouees: 2890, tirs: 94, note: 7.7, forme: ['V','V','N','V','V'], description: 'Chucky, vitesse et technique au service du Tri.' },
  { id: 52, nom: 'Raúl Jiménez', pays: 'Mexico', flag: '🇲🇽', groupe: 'A', poste: 'Attaquant', club: 'Fulham', age: 34, buts: 14, passes: 6, xG: 12.8, xA: 4.8, matchsJoues: 33, minutesJouees: 2640, tirs: 82, note: 7.4, forme: ['V','N','V','V','N'], description: 'Buteur expérimenté, référence offensive du Mexique.' },
  // CANADA
  { id: 53, nom: 'Alphonso Davies', pays: 'Canada', flag: '🇨🇦', groupe: 'C', poste: 'Défenseur', club: 'Bayern Munich', age: 24, buts: 6, passes: 14, xG: 4.8, xA: 12.2, matchsJoues: 35, minutesJouees: 3020, tirs: 38, note: 8.0, forme: ['V','V','V','N','V'], description: 'Défenseur le plus rapide du monde, dévastateur offensivement.' },
  { id: 54, nom: 'Jonathan David', pays: 'Canada', flag: '🇨🇦', groupe: 'C', poste: 'Attaquant', club: 'Lille', age: 25, buts: 28, passes: 8, xG: 24.6, xA: 6.4, matchsJoues: 37, minutesJouees: 3180, tirs: 128, note: 8.1, forme: ['V','V','V','V','N'], description: 'Meilleur buteur de Ligue 1, l\'une des révélations mondiales.' },
  // NIGERIA
  { id: 55, nom: 'Victor Osimhen', pays: 'Nigeria', flag: '🇳🇬', groupe: 'G', poste: 'Attaquant', club: 'Galatasaray', age: 26, buts: 29, passes: 7, xG: 25.4, xA: 5.8, matchsJoues: 36, minutesJouees: 3020, tirs: 138, note: 8.0, forme: ['V','V','V','N','V'], description: 'L\'un des meilleurs attaquants africains, puissant et efficace.' },
  // SOUTH KOREA
  { id: 56, nom: 'Son Heung-min', pays: 'South Korea', flag: '🇰🇷', groupe: 'F', poste: 'Ailier', club: 'Tottenham', age: 33, buts: 18, passes: 11, xG: 15.4, xA: 9.6, matchsJoues: 36, minutesJouees: 2980, tirs: 96, note: 7.8, forme: ['V','N','V','V','V'], description: 'Captain Korea, toujours capable du geste décisif.' },
  // EGYPT
  { id: 57, nom: 'Mohamed Salah', pays: 'Egypt', flag: '🇪🇬', groupe: 'I', poste: 'Ailier', club: 'Liverpool', age: 33, buts: 29, passes: 14, xG: 24.8, xA: 12.2, matchsJoues: 37, minutesJouees: 3180, tirs: 142, note: 8.5, forme: ['V','V','V','V','V'], description: 'En feu cette saison à Liverpool, l\'un des 3 meilleurs au monde.' },
  // SERBIA
  { id: 58, nom: 'Dušan Vlahović', pays: 'Serbia', flag: '🇷🇸', groupe: 'L', poste: 'Attaquant', club: 'Juventus', age: 25, buts: 24, passes: 6, xG: 21.2, xA: 4.8, matchsJoues: 36, minutesJouees: 3050, tirs: 116, note: 7.8, forme: ['V','V','N','V','V'], description: 'L\'un des meilleurs buteurs de Serie A, redoutable de la tête.' },
  // AUSTRALIA
  { id: 59, nom: 'Mathew Ryan', pays: 'Australia', flag: '🇦🇺', groupe: 'C', poste: 'Défenseur', club: 'AZ Alkmaar', age: 32, buts: 0, passes: 2, xG: 0.1, xA: 1.4, matchsJoues: 38, minutesJouees: 3420, tirs: 4, note: 7.4, forme: ['V','N','V','V','N'], description: 'Gardien expérimenté, dernier rempart des Socceroos.' },
  // URUGUAY
  { id: 60, nom: 'Darwin Núñez', pays: 'Uruguay', flag: '🇺🇾', groupe: 'E', poste: 'Attaquant', club: 'Liverpool', age: 25, buts: 22, passes: 9, xG: 19.6, xA: 7.8, matchsJoues: 36, minutesJouees: 2940, tirs: 118, note: 7.7, forme: ['V','V','V','N','V'], description: 'Puissant et rapide, le danger numéro 1 de l\'Uruguay.' },
]

// EXTRA PLAYERS 2 — Nations supplémentaires (IDs 61-90)
export const EXTRA_PLAYERS_2: Player[] = [
  // ECUADOR
  { id: 61, nom: 'Moisés Caicedo', pays: 'Ecuador', flag: '🇪🇨', groupe: 'B', poste: 'Milieu', club: 'Chelsea', age: 23, buts: 4, passes: 9, xG: 3.6, xA: 7.8, matchsJoues: 35, minutesJouees: 3010, tirs: 34, note: 7.6, forme: ['V','V','N','V','V'], description: 'Milieu défensif élite, l\'une des plus grosses ventes de l\'histoire de PL.' },
  { id: 62, nom: 'Enner Valencia', pays: 'Ecuador', flag: '🇪🇨', groupe: 'B', poste: 'Attaquant', club: 'Internacional', age: 35, buts: 12, passes: 5, xG: 10.4, xA: 3.8, matchsJoues: 30, minutesJouees: 2480, tirs: 68, note: 7.3, forme: ['V','N','V','N','V'], description: 'Capitaine historique et symbole du football équatorien.' },
  // ITALY
  { id: 63, nom: 'Nicolò Barella', pays: 'Italy', flag: '🇮🇹', groupe: 'K', poste: 'Milieu', club: 'Inter Milan', age: 28, buts: 9, passes: 16, xG: 7.8, xA: 13.9, matchsJoues: 36, minutesJouees: 3100, tirs: 58, note: 7.9, forme: ['V','V','V','N','V'], description: 'Box-to-box complet, moteur de l\'Inter et de l\'Italie.' },
  { id: 64, nom: 'Federico Chiesa', pays: 'Italy', flag: '🇮🇹', groupe: 'K', poste: 'Ailier', club: 'Liverpool', age: 27, buts: 13, passes: 10, xG: 10.8, xA: 8.4, matchsJoues: 33, minutesJouees: 2640, tirs: 78, note: 7.6, forme: ['V','N','V','V','V'], description: 'Explosif sur son côté, capable du geste exceptionnel.' },
  // CHILE
  { id: 65, nom: 'Alexis Sánchez', pays: 'Chile', flag: '🇨🇱', groupe: 'C', poste: 'Attaquant', club: 'Udinese', age: 36, buts: 11, passes: 8, xG: 9.4, xA: 6.8, matchsJoues: 29, minutesJouees: 2180, tirs: 72, note: 7.2, forme: ['V','V','N','V','N'], description: 'Légende chilienne, sa dernière CdM après une carrière exceptionnelle.' },
  { id: 66, nom: 'Ben Brereton Díaz', pays: 'Chile', flag: '🇨🇱', groupe: 'C', poste: 'Attaquant', club: 'Real Betis', age: 25, buts: 16, passes: 6, xG: 13.6, xA: 4.8, matchsJoues: 34, minutesJouees: 2780, tirs: 88, note: 7.4, forme: ['V','V','V','N','V'], description: 'Né en Angleterre, devenu héros national au Chili, buteur prolifique.' },
  // TURKEY
  { id: 67, nom: 'Arda Güler', pays: 'Turkey', flag: '🇹🇷', groupe: 'A', poste: 'Milieu offensif', club: 'Real Madrid', age: 20, buts: 12, passes: 14, xG: 9.8, xA: 11.6, matchsJoues: 32, minutesJouees: 2480, tirs: 68, note: 7.8, forme: ['V','V','V','V','N'], description: 'Prodige turc de 20 ans, déjà titulaire au Real Madrid.' },
  { id: 68, nom: 'Hakan Çalhanoğlu', pays: 'Turkey', flag: '🇹🇷', groupe: 'A', poste: 'Milieu', club: 'Inter Milan', age: 31, buts: 11, passes: 14, xG: 9.2, xA: 12.4, matchsJoues: 35, minutesJouees: 3020, tirs: 72, note: 7.8, forme: ['V','N','V','V','V'], description: 'Régisseur de l\'Inter champion, leadership et qualité technique.' },
  // DENMARK
  { id: 69, nom: 'Rasmus Højlund', pays: 'Denmark', flag: '🇩🇰', groupe: 'K', poste: 'Attaquant', club: 'Manchester United', age: 22, buts: 18, passes: 7, xG: 15.6, xA: 5.4, matchsJoues: 35, minutesJouees: 2960, tirs: 94, note: 7.6, forme: ['V','V','N','V','V'], description: 'Jeune attaquant danois, puissant et rapide, en pleine progression.' },
  { id: 70, nom: 'Christian Eriksen', pays: 'Denmark', flag: '🇩🇰', groupe: 'K', poste: 'Milieu offensif', club: 'Manchester United', age: 33, buts: 8, passes: 16, xG: 6.8, xA: 13.8, matchsJoues: 32, minutesJouees: 2580, tirs: 54, note: 7.7, forme: ['V','N','V','V','V'], description: 'Revenu au plus haut niveau après son arrêt cardiaque, grande inspiration.' },
  // POLAND
  { id: 71, nom: 'Robert Lewandowski', pays: 'Poland', flag: '🇵🇱', groupe: 'I', poste: 'Attaquant', club: 'Barcelona', age: 37, buts: 26, passes: 8, xG: 22.4, xA: 6.8, matchsJoues: 35, minutesJouees: 2940, tirs: 122, note: 7.9, forme: ['V','V','V','N','V'], description: 'Toujours l\'un des meilleurs buteurs du monde malgré son âge.' },
  // ALGERIA
  { id: 72, nom: 'Riyad Mahrez', pays: 'Algeria', flag: '🇩🇿', groupe: 'J', poste: 'Ailier', club: 'Al-Ahli', age: 34, buts: 14, passes: 12, xG: 11.8, xA: 10.2, matchsJoues: 32, minutesJouees: 2680, tirs: 82, note: 7.5, forme: ['V','V','N','V','V'], description: 'Meilleur joueur africain de sa génération, encore décisif à haut niveau.' },
  // CAMEROON
  { id: 73, nom: 'André-Frank Zambo Anguissa', pays: 'Cameroon', flag: '🇨🇲', groupe: 'H', poste: 'Milieu', club: 'Napoli', age: 29, buts: 5, passes: 11, xG: 4.2, xA: 9.4, matchsJoues: 35, minutesJouees: 3080, tirs: 42, note: 7.5, forme: ['V','N','V','V','V'], description: 'Milieu puissant et technique, pilier de Napoli et des Lions Indomptables.' },
  { id: 74, nom: 'Vincent Aboubakar', pays: 'Cameroon', flag: '🇨🇲', groupe: 'H', poste: 'Attaquant', club: 'Al-Qadsiah', age: 33, buts: 16, passes: 6, xG: 13.8, xA: 4.6, matchsJoues: 31, minutesJouees: 2540, tirs: 86, note: 7.3, forme: ['V','V','N','N','V'], description: 'Capitaine camerounais, grand finisseur et leader dans les grands matchs.' },
  // SOUTH AFRICA
  { id: 75, nom: 'Percy Tau', pays: 'South Africa', flag: '🇿🇦', groupe: 'J', poste: 'Ailier', club: 'Al Ahly', age: 31, buts: 14, passes: 11, xG: 11.4, xA: 9.2, matchsJoues: 33, minutesJouees: 2720, tirs: 78, note: 7.3, forme: ['V','V','N','V','N'], description: 'Star du football africain, l\'outil offensif principal de Bafana Bafana.' },
  // SAUDI ARABIA
  { id: 76, nom: 'Salem Al-Dawsari', pays: 'Saudi Arabia', flag: '🇸🇦', groupe: 'C', poste: 'Ailier', club: 'Al-Hilal', age: 32, buts: 16, passes: 13, xG: 13.2, xA: 11.4, matchsJoues: 34, minutesJouees: 2880, tirs: 84, note: 7.4, forme: ['V','V','V','N','V'], description: 'Héros du but contre l\'Argentine en 2022, référence technique de la Saudi Pro.' },
  // IRAN
  { id: 77, nom: 'Mehdi Taremi', pays: 'Iran', flag: '🇮🇷', groupe: 'B', poste: 'Attaquant', club: 'Inter Milan', age: 32, buts: 19, passes: 9, xG: 16.4, xA: 7.8, matchsJoues: 34, minutesJouees: 2780, tirs: 98, note: 7.6, forme: ['V','N','V','V','V'], description: 'Buteur iranien à l\'Inter Milan, technique et efficacité au rendez-vous.' },
  // PARAGUAY
  { id: 78, nom: 'Miguel Almirón', pays: 'Paraguay', flag: '🇵🇾', groupe: 'F', poste: 'Milieu offensif', club: 'Newcastle United', age: 30, buts: 10, passes: 13, xG: 8.6, xA: 11.2, matchsJoues: 35, minutesJouees: 2860, tirs: 68, note: 7.4, forme: ['V','V','N','V','V'], description: 'Infatigable et technique, âme du milieu paraguayen.' },
  // VENEZUELA
  { id: 79, nom: 'Salomón Rondón', pays: 'Venezuela', flag: '🇻🇪', groupe: 'A', poste: 'Attaquant', club: 'Everton', age: 35, buts: 11, passes: 6, xG: 9.8, xA: 4.4, matchsJoues: 30, minutesJouees: 2340, tirs: 72, note: 7.1, forme: ['N','V','V','N','V'], description: 'Légende vénézuélienne, capitaine et meilleur buteur historique.' },
  // HONDURAS
  { id: 80, nom: 'Romell Quioto', pays: 'Honduras', flag: '🇭🇳', groupe: 'C', poste: 'Ailier', club: 'CF Montréal', age: 31, buts: 10, passes: 9, xG: 8.2, xA: 7.6, matchsJoues: 32, minutesJouees: 2580, tirs: 64, note: 7.1, forme: ['V','N','V','V','N'], description: 'Ailier rapide et technique, menace principale de la Bicolor.' },
  // PANAMA
  { id: 81, nom: 'Rolando Blackburn', pays: 'Panama', flag: '🇵🇦', groupe: 'A', poste: 'Attaquant', club: 'Club Atlético Independiente', age: 30, buts: 8, passes: 5, xG: 6.8, xA: 3.8, matchsJoues: 28, minutesJouees: 2140, tirs: 52, note: 7.0, forme: ['V','N','V','N','V'], description: 'Attaquant efficace, pièce maîtresse de l\'attaque panaméenne.' },
  // NEW ZEALAND
  { id: 82, nom: 'Chris Wood', pays: 'New Zealand', flag: '🇳🇿', groupe: 'D', poste: 'Attaquant', club: 'Nottingham Forest', age: 33, buts: 14, passes: 5, xG: 12.4, xA: 3.8, matchsJoues: 34, minutesJouees: 2760, tirs: 82, note: 7.3, forme: ['V','V','N','V','V'], description: 'Buteur fiable de Premier League, référence absolue des All Whites.' },
  // DR CONGO
  { id: 83, nom: 'Cédric Bakambu', pays: 'DR Congo', flag: '🇨🇩', groupe: 'J', poste: 'Attaquant', club: 'Olympique de Marseille', age: 34, buts: 13, passes: 7, xG: 11.2, xA: 5.6, matchsJoues: 32, minutesJouees: 2580, tirs: 76, note: 7.2, forme: ['V','N','V','V','V'], description: 'Attaquant expérimenté, leader offensif des Léopards.' },
  // BOLIVIA
  { id: 84, nom: 'Ramiro Vaca', pays: 'Bolivia', flag: '🇧🇴', groupe: 'I', poste: 'Milieu offensif', club: 'Bolívar', age: 30, buts: 8, passes: 12, xG: 6.8, xA: 10.4, matchsJoues: 33, minutesJouees: 2760, tirs: 56, note: 7.0, forme: ['N','V','V','N','V'], description: 'Créateur talentueux, meneur de jeu de la Verde.' },
  // TUNISIA
  { id: 85, nom: 'Ellyes Skhiri', pays: 'Tunisia', flag: '🇹🇳', groupe: 'I', poste: 'Milieu', club: 'Eintracht Frankfurt', age: 29, buts: 5, passes: 10, xG: 4.2, xA: 8.6, matchsJoues: 34, minutesJouees: 2920, tirs: 38, note: 7.3, forme: ['V','V','N','V','V'], description: 'Milieu défensif rigoureux, pilier de la Tunisie en Bundesliga.' },
  // PERU
  { id: 86, nom: 'Gianluca Lapadula', pays: 'Peru', flag: '🇵🇪', groupe: 'K', poste: 'Attaquant', club: 'Cagliari', age: 34, buts: 12, passes: 5, xG: 10.4, xA: 3.8, matchsJoues: 31, minutesJouees: 2440, tirs: 72, note: 7.1, forme: ['V','N','V','V','N'], description: 'Attaquant italo-péruvien, battant et efficace devant le but.' },
  // QATAR
  { id: 87, nom: 'Akram Afif', pays: 'Qatar', flag: '🇶🇦', groupe: 'A', poste: 'Ailier', club: 'Al-Sadd', age: 28, buts: 18, passes: 14, xG: 15.2, xA: 12.4, matchsJoues: 33, minutesJouees: 2780, tirs: 92, note: 7.5, forme: ['V','V','V','N','V'], description: 'Meilleur joueur de la Coupe d\'Asie 2023, leader technique du Qatar.' },
  // JAMAICA
  { id: 88, nom: 'Michail Antonio', pays: 'Jamaica', flag: '🇯🇲', groupe: 'L', poste: 'Attaquant', club: 'West Ham', age: 34, buts: 10, passes: 7, xG: 8.6, xA: 5.8, matchsJoues: 28, minutesJouees: 2140, tirs: 62, note: 7.1, forme: ['V','N','N','V','V'], description: 'Physique redoutable, meilleur buteur historique des Reggae Boyz.' },
  // UZBEKISTAN
  { id: 89, nom: 'Eldor Shomurodov', pays: 'Uzbekistan', flag: '🇺🇿', groupe: 'E', poste: 'Attaquant', club: 'Roma', age: 28, buts: 11, passes: 6, xG: 9.4, xA: 4.8, matchsJoues: 32, minutesJouees: 2480, tirs: 68, note: 7.2, forme: ['V','V','N','V','V'], description: 'Référence du football ouzbek, buteur régulier en Serie A.' },
  // AUSTRIA
  { id: 90, nom: 'Marko Arnautovic', pays: 'Austria', flag: '🇦🇹', groupe: 'L', poste: 'Attaquant', club: 'Inter Milan', age: 35, buts: 14, passes: 7, xG: 12.2, xA: 5.6, matchsJoues: 31, minutesJouees: 2380, tirs: 82, note: 7.3, forme: ['V','N','V','V','V'], description: 'Buteur expérimenté de Serie A, captain de l\'équipe nationale autrichienne.' },
]

// =============================================
// EXPORT PRINCIPAL — 90 joueurs CdM 2026
// =============================================
export const ALL_CDM_PLAYERS: Player[] = [...CDM_PLAYERS, ...EXTRA_PLAYERS, ...EXTRA_PLAYERS_2]

// Export v1 gardé pour compatibilité
export const ALL_CDM_PLAYERS_V1 = [...CDM_PLAYERS, ...EXTRA_PLAYERS]

// =============================================
// FONCTIONS UTILITAIRES
// =============================================
export function getPlayersByPays(pays: string) {
  return ALL_CDM_PLAYERS.filter(p => p.pays === pays)
}

export function getPlayerById(id: number) {
  return ALL_CDM_PLAYERS.find(p => p.id === id)
}

export function getPlayersByGroupe(groupe: string) {
  return ALL_CDM_PLAYERS.filter(p => p.groupe === groupe)
}
