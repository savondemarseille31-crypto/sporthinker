// Profils joueurs Roland Garros — données réelles Jeff Sackmann (2023-2026)
// Source : github.com/JeffSackmann/tennis_atp + tennis_wta
// Régénérer : python3 scripts/calc-clay-stats.py
// ESPN curatedRank override le rank quand disponible.

export type ClayProfile = {
  name: string
  rank: number          // Classement ATP/WTA 2026 (approximatif)
  clayWinRate: number   // Win rate clay 2023-2026 (réel)
  clayMatches: number   // Matchs clay joués (base statistique)
  rgTitles?: number     // Titres Roland Garros
  // Stats service sur clay — issues des données Jeff Sackmann
  firstServeIn?: number // % 1ère balle dans (ex: 0.67 = 67%)
  ptsWon1st?: number    // % pts gagnés sur 1ère balle
  ptsWon2nd?: number    // % pts gagnés sur 2ème balle
}

// ── ATP ───────────────────────────────────────────────────────────────────────

export const ATP_CLAY_PROFILES: ClayProfile[] = [
  { name: 'Carlos Alcaraz',              rank:  1, clayWinRate: 0.873, clayMatches:  79, rgTitles: 1, firstServeIn: 0.670, ptsWon1st: 0.692, ptsWon2nd: 0.562 },
  { name: 'Jannik Sinner',               rank:  2, clayWinRate: 0.820, clayMatches:  50,              firstServeIn: 0.608, ptsWon1st: 0.756, ptsWon2nd: 0.582 },
  { name: 'Novak Djokovic',              rank:  4, clayWinRate: 0.787, clayMatches:  47, rgTitles: 3, firstServeIn: 0.663, ptsWon1st: 0.728, ptsWon2nd: 0.552 },
  { name: 'Alexander Zverev',            rank:  3, clayWinRate: 0.758, clayMatches:  95,              firstServeIn: 0.699, ptsWon1st: 0.736, ptsWon2nd: 0.512 },
  { name: 'Casper Ruud',                 rank:  7, clayWinRate: 0.750, clayMatches:  88,              firstServeIn: 0.647, ptsWon1st: 0.704, ptsWon2nd: 0.551 },
  { name: 'Stefanos Tsitsipas',          rank:  9, clayWinRate: 0.721, clayMatches:  68,              firstServeIn: 0.623, ptsWon1st: 0.744, ptsWon2nd: 0.541 },
  { name: 'Holger Rune',                 rank:  8, clayWinRate: 0.709, clayMatches:  55,              firstServeIn: 0.612, ptsWon1st: 0.703, ptsWon2nd: 0.533 },
  { name: 'Matteo Berrettini',           rank: 38, clayWinRate: 0.703, clayMatches:  37,              firstServeIn: 0.698, ptsWon1st: 0.759, ptsWon2nd: 0.523 },
  { name: 'Andrey Rublev',               rank: 11, clayWinRate: 0.692, clayMatches:  65,              firstServeIn: 0.596, ptsWon1st: 0.732, ptsWon2nd: 0.517 },
  { name: 'Daniil Medvedev',             rank:  5, clayWinRate: 0.682, clayMatches:  44,              firstServeIn: 0.613, ptsWon1st: 0.718, ptsWon2nd: 0.468 },
  { name: 'Luciano Darderi',             rank: 28, clayWinRate: 0.675, clayMatches:  80,              firstServeIn: 0.579, ptsWon1st: 0.713, ptsWon2nd: 0.533 },
  { name: 'Tommy Paul',                  rank: 16, clayWinRate: 0.674, clayMatches:  43,              firstServeIn: 0.638, ptsWon1st: 0.684, ptsWon2nd: 0.529 },
  { name: 'Hubert Hurkacz',              rank: 10, clayWinRate: 0.659, clayMatches:  44,              firstServeIn: 0.612, ptsWon1st: 0.766, ptsWon2nd: 0.512 },
  { name: 'Lorenzo Musetti',             rank: 17, clayWinRate: 0.658, clayMatches:  79,              firstServeIn: 0.655, ptsWon1st: 0.693, ptsWon2nd: 0.523 },
  { name: 'Arthur Fils',                 rank: 20, clayWinRate: 0.655, clayMatches:  58,              firstServeIn: 0.616, ptsWon1st: 0.708, ptsWon2nd: 0.514 },
  { name: 'Francisco Cerundolo',         rank: 24, clayWinRate: 0.640, clayMatches: 114,              firstServeIn: 0.649, ptsWon1st: 0.674, ptsWon2nd: 0.521 },
  { name: 'Flavio Cobolli',              rank: 35, clayWinRate: 0.636, clayMatches:  55,              firstServeIn: 0.565, ptsWon1st: 0.695, ptsWon2nd: 0.538 },
  { name: 'Cameron Norrie',              rank: 45, clayWinRate: 0.635, clayMatches:  63,              firstServeIn: 0.640, ptsWon1st: 0.689, ptsWon2nd: 0.505 },
  { name: 'Taylor Fritz',                rank:  6, clayWinRate: 0.630, clayMatches:  46,              firstServeIn: 0.617, ptsWon1st: 0.772, ptsWon2nd: 0.537 },
  { name: 'Sebastian Baez',              rank: 31, clayWinRate: 0.617, clayMatches: 107,              firstServeIn: 0.712, ptsWon1st: 0.644, ptsWon2nd: 0.527 },
  { name: 'Jan Lennard Struff',          rank: 46, clayWinRate: 0.617, clayMatches:  47,              firstServeIn: 0.569, ptsWon1st: 0.750, ptsWon2nd: 0.518 },
  { name: 'Jiri Lehecka',                rank: 28, clayWinRate: 0.611, clayMatches:  36,              firstServeIn: 0.655, ptsWon1st: 0.706, ptsWon2nd: 0.505 },
  { name: 'Karen Khachanov',             rank: 14, clayWinRate: 0.609, clayMatches:  46,              firstServeIn: 0.636, ptsWon1st: 0.703, ptsWon2nd: 0.537 },
  { name: 'Alex de Minaur',              rank: 12, clayWinRate: 0.609, clayMatches:  46,              firstServeIn: 0.538, ptsWon1st: 0.698, ptsWon2nd: 0.550 },
  { name: 'Jakub Mensik',                rank: 22, clayWinRate: 0.609, clayMatches:  23,              firstServeIn: 0.611, ptsWon1st: 0.749, ptsWon2nd: 0.518 },
  { name: 'Frances Tiafoe',              rank: 25, clayWinRate: 0.605, clayMatches:  43,              firstServeIn: 0.588, ptsWon1st: 0.725, ptsWon2nd: 0.556 },
  { name: 'Tomas Martin Etcheverry',     rank: 40, clayWinRate: 0.598, clayMatches: 102,              firstServeIn: 0.633, ptsWon1st: 0.712, ptsWon2nd: 0.519 },
  { name: 'Grigor Dimitrov',             rank: 15, clayWinRate: 0.590, clayMatches:  39,              firstServeIn: 0.585, ptsWon1st: 0.742, ptsWon2nd: 0.506 },
  { name: 'Joao Fonseca',                rank: 19, clayWinRate: 0.571, clayMatches:  35,              firstServeIn: 0.653, ptsWon1st: 0.693, ptsWon2nd: 0.534 },
  { name: 'Ben Shelton',                 rank: 18, clayWinRate: 0.571, clayMatches:  42,              firstServeIn: 0.634, ptsWon1st: 0.732, ptsWon2nd: 0.528 },
  { name: 'Jack Draper',                 rank: 13, clayWinRate: 0.571, clayMatches:  35,              firstServeIn: 0.625, ptsWon1st: 0.744, ptsWon2nd: 0.517 },
  { name: 'Thiago Agustin Tirante',      rank: 50, clayWinRate: 0.571, clayMatches:  28,              firstServeIn: 0.642, ptsWon1st: 0.713, ptsWon2nd: 0.526 },
  { name: 'Felix Auger-Aliassime',       rank: 27, clayWinRate: 0.568, clayMatches:  44,              firstServeIn: 0.635, ptsWon1st: 0.750, ptsWon2nd: 0.503 },
  { name: 'Mariano Navone',              rank: 39, clayWinRate: 0.565, clayMatches:  62,              firstServeIn: 0.700, ptsWon1st: 0.620, ptsWon2nd: 0.501 },
  { name: 'Alexander Bublik',            rank: 33, clayWinRate: 0.560, clayMatches:  50,              firstServeIn: 0.611, ptsWon1st: 0.735, ptsWon2nd: 0.470 },
  { name: 'Tomas Machac',                rank: 26, clayWinRate: 0.543, clayMatches:  35,              firstServeIn: 0.644, ptsWon1st: 0.645, ptsWon2nd: 0.520 },
  { name: 'Laslo Djere',                 rank: 48, clayWinRate: 0.542, clayMatches:  59,              firstServeIn: 0.611, ptsWon1st: 0.715, ptsWon2nd: 0.535 },
  { name: 'Nicolas Jarry',               rank: 36, clayWinRate: 0.533, clayMatches:  60,              firstServeIn: 0.634, ptsWon1st: 0.728, ptsWon2nd: 0.532 },
  { name: 'Alejandro Davidovich Fokina', rank: 42, clayWinRate: 0.524, clayMatches:  42,              firstServeIn: 0.687, ptsWon1st: 0.650, ptsWon2nd: 0.510 },
  { name: 'Matteo Arnaldi',              rank: 32, clayWinRate: 0.532, clayMatches:  47,              firstServeIn: 0.562, ptsWon1st: 0.684, ptsWon2nd: 0.500 },
]

// ── WTA ───────────────────────────────────────────────────────────────────────

export const WTA_CLAY_PROFILES: ClayProfile[] = [
  { name: 'Iga Swiatek',                 rank:  2, clayWinRate: 0.853, clayMatches:  68, rgTitles: 4, firstServeIn: 0.629, ptsWon1st: 0.691, ptsWon2nd: 0.535 },
  { name: 'Aryna Sabalenka',             rank:  1, clayWinRate: 0.820, clayMatches:  61,              firstServeIn: 0.631, ptsWon1st: 0.684, ptsWon2nd: 0.503 },
  { name: 'Elena Rybakina',              rank:  4, clayWinRate: 0.809, clayMatches:  47,              firstServeIn: 0.601, ptsWon1st: 0.719, ptsWon2nd: 0.492 },
  { name: 'Mirra Andreeva',              rank:  7, clayWinRate: 0.763, clayMatches:  59,              firstServeIn: 0.632, ptsWon1st: 0.649, ptsWon2nd: 0.490 },
  { name: 'Qinwen Zheng',                rank:  6, clayWinRate: 0.750, clayMatches:  52,              firstServeIn: 0.523, ptsWon1st: 0.710, ptsWon2nd: 0.475 },
  { name: 'Coco Gauff',                  rank:  3, clayWinRate: 0.750, clayMatches:  56, rgTitles: 1, firstServeIn: 0.595, ptsWon1st: 0.675, ptsWon2nd: 0.449 },
  { name: 'Madison Keys',                rank: 10, clayWinRate: 0.721, clayMatches:  43,              firstServeIn: 0.653, ptsWon1st: 0.660, ptsWon2nd: 0.464 },
  { name: 'Karolina Muchova',            rank: 18, clayWinRate: 0.720, clayMatches:  25,              firstServeIn: 0.639, ptsWon1st: 0.625, ptsWon2nd: 0.517 },
  { name: 'Danielle Collins',            rank: 30, clayWinRate: 0.711, clayMatches:  38,              firstServeIn: 0.587, ptsWon1st: 0.700, ptsWon2nd: 0.469 },
  { name: 'Jessica Pegula',              rank:  6, clayWinRate: 0.707, clayMatches:  41,              firstServeIn: 0.602, ptsWon1st: 0.664, ptsWon2nd: 0.482 },
  { name: 'Elina Svitolina',             rank: 22, clayWinRate: 0.706, clayMatches:  51,              firstServeIn: 0.630, ptsWon1st: 0.638, ptsWon2nd: 0.467 },
  { name: 'Marta Kostyuk',               rank: 23, clayWinRate: 0.692, clayMatches:  39,              firstServeIn: 0.594, ptsWon1st: 0.631, ptsWon2nd: 0.446 },
  { name: 'Jasmine Paolini',             rank:  5, clayWinRate: 0.681, clayMatches:  47,              firstServeIn: 0.720, ptsWon1st: 0.606, ptsWon2nd: 0.496 },
  { name: 'Marketa Vondrousova',         rank:  8, clayWinRate: 0.679, clayMatches:  28,              firstServeIn: 0.631, ptsWon1st: 0.634, ptsWon2nd: 0.449 },
  { name: 'Ons Jabeur',                  rank: 29, clayWinRate: 0.645, clayMatches:  31,              firstServeIn: 0.576, ptsWon1st: 0.649, ptsWon2nd: 0.487 },
  { name: 'Anastasia Potapova',          rank: 35, clayWinRate: 0.643, clayMatches:  42,              firstServeIn: 0.571, ptsWon1st: 0.659, ptsWon2nd: 0.449 },
  { name: 'Diana Shnaider',              rank: 27, clayWinRate: 0.614, clayMatches:  44,              firstServeIn: 0.636, ptsWon1st: 0.633, ptsWon2nd: 0.477 },
  { name: 'Jelena Ostapenko',            rank: 31, clayWinRate: 0.610, clayMatches:  41,              firstServeIn: 0.597, ptsWon1st: 0.615, ptsWon2nd: 0.455 },
  { name: 'Daria Kasatkina',             rank: 14, clayWinRate: 0.595, clayMatches:  42,              firstServeIn: 0.729, ptsWon1st: 0.584, ptsWon2nd: 0.404 },
  { name: 'Paula Badosa',                rank: 26, clayWinRate: 0.595, clayMatches:  37,              firstServeIn: 0.603, ptsWon1st: 0.655, ptsWon2nd: 0.460 },
  { name: 'Beatriz Haddad Maia',         rank: 11, clayWinRate: 0.564, clayMatches:  39,              firstServeIn: 0.670, ptsWon1st: 0.605, ptsWon2nd: 0.457 },
  { name: 'Maria Sakkari',               rank: 17, clayWinRate: 0.543, clayMatches:  35,              firstServeIn: 0.613, ptsWon1st: 0.651, ptsWon2nd: 0.485 },
  { name: 'Veronika Kudermetova',        rank: 24, clayWinRate: 0.545, clayMatches:  33,              firstServeIn: 0.598, ptsWon1st: 0.643, ptsWon2nd: 0.440 },
  { name: 'Emma Navarro',                rank:  9, clayWinRate: 0.541, clayMatches:  37,              firstServeIn: 0.615, ptsWon1st: 0.618, ptsWon2nd: 0.484 },
  { name: 'Liudmila Samsonova',          rank: 15, clayWinRate: 0.541, clayMatches:  37,              firstServeIn: 0.581, ptsWon1st: 0.693, ptsWon2nd: 0.467 },
  { name: 'Elise Mertens',               rank: 32, clayWinRate: 0.543, clayMatches:  35,              firstServeIn: 0.556, ptsWon1st: 0.665, ptsWon2nd: 0.446 },
  { name: 'Donna Vekic',                 rank: 29, clayWinRate: 0.543, clayMatches:  35,              firstServeIn: 0.565, ptsWon1st: 0.667, ptsWon2nd: 0.433 },
  { name: 'Yulia Putintseva',            rank: 28, clayWinRate: 0.550, clayMatches:  40,              firstServeIn: 0.729, ptsWon1st: 0.605, ptsWon2nd: 0.440 },
  { name: 'Anna Kalinskaya',             rank: 20, clayWinRate: 0.533, clayMatches:  30,              firstServeIn: 0.665, ptsWon1st: 0.625, ptsWon2nd: 0.486 },
  { name: 'Camila Osorio',               rank: 45, clayWinRate: 0.667, clayMatches:  45,              firstServeIn: 0.662, ptsWon1st: 0.602, ptsWon2nd: 0.412 },
]

// ── Matching ──────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z ]/g, '').trim()
}

export function findClayProfile(
  name: string,
  profiles: ClayProfile[],
): ClayProfile | null {
  const n = norm(name)

  const exact = profiles.find(p => norm(p.name) === n)
  if (exact) return exact

  const lastName = n.split(' ').pop()!
  if (lastName.length > 3) {
    return profiles.find(p => norm(p.name).split(' ').pop() === lastName) ?? null
  }

  return null
}
