const CDM_FIXTURES_RAW = [
  // ── GROUPE A : Mexico · South Korea · South Africa · Czechia ──────────────
  { id: 1,  date: '2026-06-11', heure: '21:00', domicile: 'Mexico',       flagD: '🇲🇽', exterieur: 'South Africa', flagE: '🇿🇦', groupe: 'A', stade: 'Estadio Azteca, Mexico City' },
  { id: 2,  date: '2026-06-12', heure: '04:00', domicile: 'South Korea',  flagD: '🇰🇷', exterieur: 'Czechia',      flagE: '🇨🇿', groupe: 'A', stade: 'Estadio Akron, Guadalajara' },
  { id: 3,  date: '2026-06-18', heure: '18:00', domicile: 'Czechia',      flagD: '🇨🇿', exterieur: 'South Africa', flagE: '🇿🇦', groupe: 'A', stade: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 4,  date: '2026-06-19', heure: '03:00', domicile: 'Mexico',       flagD: '🇲🇽', exterieur: 'South Korea',  flagE: '🇰🇷', groupe: 'A', stade: 'Estadio Akron, Guadalajara' },
  { id: 5,  date: '2026-06-25', heure: '03:00', domicile: 'Czechia',      flagD: '🇨🇿', exterieur: 'Mexico',       flagE: '🇲🇽', groupe: 'A', stade: 'Estadio Azteca, Mexico City' },
  { id: 6,  date: '2026-06-25', heure: '03:00', domicile: 'South Africa', flagD: '🇿🇦', exterieur: 'South Korea',  flagE: '🇰🇷', groupe: 'A', stade: 'Estadio BBVA, Monterrey' },

  // ── GROUPE B : Canada · Switzerland · Qatar · Bosnia-Herzegovina ──────────
  { id: 7,  date: '2026-06-12', heure: '21:00', domicile: 'Canada',             flagD: '🇨🇦', exterieur: 'Bosnia-Herzegovina', flagE: '🇧🇦', groupe: 'B', stade: 'BMO Field, Toronto' },
  { id: 8,  date: '2026-06-13', heure: '21:00', domicile: 'Qatar',              flagD: '🇶🇦', exterieur: 'Switzerland',        flagE: '🇨🇭', groupe: 'B', stade: "Levi's Stadium, San Francisco" },
  { id: 9,  date: '2026-06-18', heure: '21:00', domicile: 'Switzerland',        flagD: '🇨🇭', exterieur: 'Bosnia-Herzegovina', flagE: '🇧🇦', groupe: 'B', stade: 'SoFi Stadium, Los Angeles' },
  { id: 10, date: '2026-06-19', heure: '00:00', domicile: 'Canada',             flagD: '🇨🇦', exterieur: 'Qatar',              flagE: '🇶🇦', groupe: 'B', stade: 'BC Place, Vancouver' },
  { id: 11, date: '2026-06-24', heure: '21:00', domicile: 'Switzerland',        flagD: '🇨🇭', exterieur: 'Canada',             flagE: '🇨🇦', groupe: 'B', stade: 'BC Place, Vancouver' },
  { id: 12, date: '2026-06-24', heure: '21:00', domicile: 'Bosnia-Herzegovina', flagD: '🇧🇦', exterieur: 'Qatar',              flagE: '🇶🇦', groupe: 'B', stade: 'Lumen Field, Seattle' },

  // ── GROUPE C : Brazil · Morocco · Scotland · Haiti ────────────────────────
  { id: 13, date: '2026-06-14', heure: '00:00', domicile: 'Brazil',   flagD: '🇧🇷', exterieur: 'Morocco',  flagE: '🇲🇦', groupe: 'C', stade: 'MetLife Stadium, New York/NJ' },
  { id: 14, date: '2026-06-14', heure: '03:00', domicile: 'Haiti',    flagD: '🇭🇹', exterieur: 'Scotland', flagE: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', groupe: 'C', stade: 'Gillette Stadium, Boston' },
  { id: 15, date: '2026-06-20', heure: '00:00', domicile: 'Scotland', flagD: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', exterieur: 'Morocco',  flagE: '🇲🇦', groupe: 'C', stade: 'Gillette Stadium, Boston' },
  { id: 16, date: '2026-06-20', heure: '02:30', domicile: 'Brazil',   flagD: '🇧🇷', exterieur: 'Haiti',    flagE: '🇭🇹', groupe: 'C', stade: 'Lincoln Financial Field, Philadelphia' },
  { id: 17, date: '2026-06-25', heure: '00:00', domicile: 'Scotland', flagD: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', exterieur: 'Brazil',   flagE: '🇧🇷', groupe: 'C', stade: 'Hard Rock Stadium, Miami' },
  { id: 18, date: '2026-06-25', heure: '00:00', domicile: 'Morocco',  flagD: '🇲🇦', exterieur: 'Haiti',    flagE: '🇭🇹', groupe: 'C', stade: 'Mercedes-Benz Stadium, Atlanta' },

  // ── GROUPE D : USA · Paraguay · Australia · Turkey ────────────────────────
  { id: 19, date: '2026-06-13', heure: '03:00', domicile: 'USA',       flagD: '🇺🇸', exterieur: 'Paraguay',   flagE: '🇵🇾', groupe: 'D', stade: 'SoFi Stadium, Los Angeles' },
  { id: 20, date: '2026-06-14', heure: '06:00', domicile: 'Australia', flagD: '🇦🇺', exterieur: 'Turkey',     flagE: '🇹🇷', groupe: 'D', stade: 'BC Place, Vancouver' },
  { id: 21, date: '2026-06-19', heure: '21:00', domicile: 'USA',       flagD: '🇺🇸', exterieur: 'Australia',  flagE: '🇦🇺', groupe: 'D', stade: 'Lumen Field, Seattle' },
  { id: 22, date: '2026-06-20', heure: '05:00', domicile: 'Turkey',    flagD: '🇹🇷', exterieur: 'Paraguay',   flagE: '🇵🇾', groupe: 'D', stade: "Levi's Stadium, San Francisco" },
  { id: 23, date: '2026-06-26', heure: '04:00', domicile: 'Turkey',    flagD: '🇹🇷', exterieur: 'USA',        flagE: '🇺🇸', groupe: 'D', stade: 'SoFi Stadium, Los Angeles' },
  { id: 24, date: '2026-06-26', heure: '04:00', domicile: 'Paraguay',  flagD: '🇵🇾', exterieur: 'Australia',  flagE: '🇦🇺', groupe: 'D', stade: "Levi's Stadium, San Francisco" },

  // ── GROUPE E : Germany · Ecuador · Ivory Coast · Curaçao ─────────────────
  { id: 25, date: '2026-06-14', heure: '19:00', domicile: 'Germany',     flagD: '🇩🇪', exterieur: 'Curaçao',     flagE: '🇨🇼', groupe: 'E', stade: 'NRG Stadium, Houston' },
  { id: 26, date: '2026-06-15', heure: '01:00', domicile: 'Ivory Coast', flagD: '🇨🇮', exterieur: 'Ecuador',     flagE: '🇪🇨', groupe: 'E', stade: 'Lincoln Financial Field, Philadelphia' },
  { id: 27, date: '2026-06-20', heure: '22:00', domicile: 'Germany',     flagD: '🇩🇪', exterieur: 'Ivory Coast', flagE: '🇨🇮', groupe: 'E', stade: 'BMO Field, Toronto' },
  { id: 28, date: '2026-06-21', heure: '02:00', domicile: 'Ecuador',     flagD: '🇪🇨', exterieur: 'Curaçao',     flagE: '🇨🇼', groupe: 'E', stade: 'Arrowhead Stadium, Kansas City' },
  { id: 29, date: '2026-06-25', heure: '22:00', domicile: 'Ecuador',     flagD: '🇪🇨', exterieur: 'Germany',     flagE: '🇩🇪', groupe: 'E', stade: 'MetLife Stadium, New York/NJ' },
  { id: 30, date: '2026-06-25', heure: '22:00', domicile: 'Curaçao',     flagD: '🇨🇼', exterieur: 'Ivory Coast', flagE: '🇨🇮', groupe: 'E', stade: 'Lincoln Financial Field, Philadelphia' },

  // ── GROUPE F : Netherlands · Japan · Tunisia · Sweden ─────────────────────
  { id: 31, date: '2026-06-14', heure: '22:00', domicile: 'Netherlands', flagD: '🇳🇱', exterieur: 'Japan',       flagE: '🇯🇵', groupe: 'F', stade: 'AT&T Stadium, Dallas' },
  { id: 32, date: '2026-06-15', heure: '04:00', domicile: 'Sweden',      flagD: '🇸🇪', exterieur: 'Tunisia',     flagE: '🇹🇳', groupe: 'F', stade: 'Estadio BBVA, Monterrey' },
  { id: 33, date: '2026-06-20', heure: '19:00', domicile: 'Netherlands', flagD: '🇳🇱', exterieur: 'Sweden',      flagE: '🇸🇪', groupe: 'F', stade: 'NRG Stadium, Houston' },
  { id: 34, date: '2026-06-21', heure: '06:00', domicile: 'Tunisia',     flagD: '🇹🇳', exterieur: 'Japan',       flagE: '🇯🇵', groupe: 'F', stade: 'Estadio BBVA, Monterrey' },
  { id: 35, date: '2026-06-26', heure: '01:00', domicile: 'Japan',       flagD: '🇯🇵', exterieur: 'Sweden',      flagE: '🇸🇪', groupe: 'F', stade: 'AT&T Stadium, Dallas' },
  { id: 36, date: '2026-06-26', heure: '01:00', domicile: 'Tunisia',     flagD: '🇹🇳', exterieur: 'Netherlands', flagE: '🇳🇱', groupe: 'F', stade: 'Arrowhead Stadium, Kansas City' },

  // ── GROUPE G : Belgium · Iran · Egypt · New Zealand ──────────────────────
  { id: 37, date: '2026-06-15', heure: '21:00', domicile: 'Belgium',     flagD: '🇧🇪', exterieur: 'Egypt',       flagE: '🇪🇬', groupe: 'G', stade: 'BC Place, Vancouver' },
  { id: 38, date: '2026-06-16', heure: '03:00', domicile: 'Iran',        flagD: '🇮🇷', exterieur: 'New Zealand', flagE: '🇳🇿', groupe: 'G', stade: 'SoFi Stadium, Los Angeles' },
  { id: 39, date: '2026-06-21', heure: '21:00', domicile: 'Belgium',     flagD: '🇧🇪', exterieur: 'Iran',        flagE: '🇮🇷', groupe: 'G', stade: 'SoFi Stadium, Los Angeles' },
  { id: 40, date: '2026-06-22', heure: '03:00', domicile: 'New Zealand', flagD: '🇳🇿', exterieur: 'Egypt',       flagE: '🇪🇬', groupe: 'G', stade: 'BC Place, Vancouver' },
  { id: 41, date: '2026-06-27', heure: '05:00', domicile: 'Egypt',       flagD: '🇪🇬', exterieur: 'Iran',        flagE: '🇮🇷', groupe: 'G', stade: 'Lumen Field, Seattle' },
  { id: 42, date: '2026-06-27', heure: '05:00', domicile: 'New Zealand', flagD: '🇳🇿', exterieur: 'Belgium',     flagE: '🇧🇪', groupe: 'G', stade: 'BC Place, Vancouver' },

  // ── GROUPE H : Spain · Uruguay · Saudi Arabia · Cape Verde ───────────────
  { id: 43, date: '2026-06-15', heure: '18:00', domicile: 'Spain',        flagD: '🇪🇸', exterieur: 'Cape Verde',   flagE: '🇨🇻', groupe: 'H', stade: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 44, date: '2026-06-16', heure: '00:00', domicile: 'Saudi Arabia', flagD: '🇸🇦', exterieur: 'Uruguay',      flagE: '🇺🇾', groupe: 'H', stade: 'Hard Rock Stadium, Miami' },
  { id: 45, date: '2026-06-21', heure: '18:00', domicile: 'Spain',        flagD: '🇪🇸', exterieur: 'Saudi Arabia', flagE: '🇸🇦', groupe: 'H', stade: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 46, date: '2026-06-22', heure: '00:00', domicile: 'Uruguay',      flagD: '🇺🇾', exterieur: 'Cape Verde',   flagE: '🇨🇻', groupe: 'H', stade: 'Hard Rock Stadium, Miami' },
  { id: 47, date: '2026-06-27', heure: '02:00', domicile: 'Cape Verde',   flagD: '🇨🇻', exterieur: 'Saudi Arabia', flagE: '🇸🇦', groupe: 'H', stade: 'NRG Stadium, Houston' },
  { id: 48, date: '2026-06-27', heure: '02:00', domicile: 'Uruguay',      flagD: '🇺🇾', exterieur: 'Spain',        flagE: '🇪🇸', groupe: 'H', stade: 'Estadio Akron, Guadalajara' },

  // ── GROUPE I : France · Senegal · Norway · Iraq ───────────────────────────
  { id: 49, date: '2026-06-16', heure: '21:00', domicile: 'France',  flagD: '🇫🇷', exterieur: 'Senegal', flagE: '🇸🇳', groupe: 'I', stade: 'MetLife Stadium, New York/NJ' },
  { id: 50, date: '2026-06-17', heure: '00:00', domicile: 'Iraq',    flagD: '🇮🇶', exterieur: 'Norway',  flagE: '🇳🇴', groupe: 'I', stade: 'Gillette Stadium, Boston' },
  { id: 51, date: '2026-06-22', heure: '23:00', domicile: 'France',  flagD: '🇫🇷', exterieur: 'Iraq',    flagE: '🇮🇶', groupe: 'I', stade: 'Lincoln Financial Field, Philadelphia' },
  { id: 52, date: '2026-06-23', heure: '02:00', domicile: 'Norway',  flagD: '🇳🇴', exterieur: 'Senegal', flagE: '🇸🇳', groupe: 'I', stade: 'MetLife Stadium, New York/NJ' },
  { id: 53, date: '2026-06-26', heure: '21:00', domicile: 'Norway',  flagD: '🇳🇴', exterieur: 'France',  flagE: '🇫🇷', groupe: 'I', stade: 'Gillette Stadium, Boston' },
  { id: 54, date: '2026-06-26', heure: '21:00', domicile: 'Senegal', flagD: '🇸🇳', exterieur: 'Iraq',    flagE: '🇮🇶', groupe: 'I', stade: 'BMO Field, Toronto' },

  // ── GROUPE J : Argentina · Austria · Algeria · Jordan ────────────────────
  { id: 55, date: '2026-06-17', heure: '03:00', domicile: 'Argentina', flagD: '🇦🇷', exterieur: 'Algeria',   flagE: '🇩🇿', groupe: 'J', stade: 'Arrowhead Stadium, Kansas City' },
  { id: 56, date: '2026-06-17', heure: '06:00', domicile: 'Austria',   flagD: '🇦🇹', exterieur: 'Jordan',    flagE: '🇯🇴', groupe: 'J', stade: "Levi's Stadium, San Francisco" },
  { id: 57, date: '2026-06-22', heure: '19:00', domicile: 'Argentina', flagD: '🇦🇷', exterieur: 'Austria',   flagE: '🇦🇹', groupe: 'J', stade: 'AT&T Stadium, Dallas' },
  { id: 58, date: '2026-06-23', heure: '05:00', domicile: 'Jordan',    flagD: '🇯🇴', exterieur: 'Algeria',   flagE: '🇩🇿', groupe: 'J', stade: "Levi's Stadium, San Francisco" },
  { id: 59, date: '2026-06-28', heure: '04:00', domicile: 'Algeria',   flagD: '🇩🇿', exterieur: 'Austria',   flagE: '🇦🇹', groupe: 'J', stade: 'Arrowhead Stadium, Kansas City' },
  { id: 60, date: '2026-06-28', heure: '04:00', domicile: 'Jordan',    flagD: '🇯🇴', exterieur: 'Argentina', flagE: '🇦🇷', groupe: 'J', stade: 'AT&T Stadium, Dallas' },

  // ── GROUPE K : Portugal · Colombia · Uzbekistan · DR Congo ───────────────
  { id: 61, date: '2026-06-17', heure: '19:00', domicile: 'Portugal',   flagD: '🇵🇹', exterieur: 'DR Congo',   flagE: '🇨🇩', groupe: 'K', stade: 'NRG Stadium, Houston' },
  { id: 62, date: '2026-06-18', heure: '04:00', domicile: 'Uzbekistan', flagD: '🇺🇿', exterieur: 'Colombia',   flagE: '🇨🇴', groupe: 'K', stade: 'Estadio Akron, Guadalajara' },
  { id: 63, date: '2026-06-23', heure: '19:00', domicile: 'Portugal',   flagD: '🇵🇹', exterieur: 'Uzbekistan', flagE: '🇺🇿', groupe: 'K', stade: 'NRG Stadium, Houston' },
  { id: 64, date: '2026-06-24', heure: '04:00', domicile: 'Colombia',   flagD: '🇨🇴', exterieur: 'DR Congo',   flagE: '🇨🇩', groupe: 'K', stade: 'Estadio Akron, Guadalajara' },
  { id: 65, date: '2026-06-28', heure: '01:30', domicile: 'Colombia',   flagD: '🇨🇴', exterieur: 'Portugal',   flagE: '🇵🇹', groupe: 'K', stade: 'Hard Rock Stadium, Miami' },
  { id: 66, date: '2026-06-28', heure: '01:30', domicile: 'DR Congo',   flagD: '🇨🇩', exterieur: 'Uzbekistan', flagE: '🇺🇿', groupe: 'K', stade: 'Mercedes-Benz Stadium, Atlanta' },

  // ── GROUPE L : England · Croatia · Panama · Ghana ─────────────────────────
  { id: 67, date: '2026-06-17', heure: '22:00', domicile: 'England', flagD: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', exterieur: 'Croatia', flagE: '🇭🇷', groupe: 'L', stade: 'AT&T Stadium, Dallas' },
  { id: 68, date: '2026-06-18', heure: '01:00', domicile: 'Ghana',   flagD: '🇬🇭', exterieur: 'Panama',  flagE: '🇵🇦', groupe: 'L', stade: 'BMO Field, Toronto' },
  { id: 69, date: '2026-06-23', heure: '22:00', domicile: 'England', flagD: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', exterieur: 'Ghana',   flagE: '🇬🇭', groupe: 'L', stade: 'Gillette Stadium, Boston' },
  { id: 70, date: '2026-06-24', heure: '01:00', domicile: 'Panama',  flagD: '🇵🇦', exterieur: 'Croatia', flagE: '🇭🇷', groupe: 'L', stade: 'BMO Field, Toronto' },
  { id: 71, date: '2026-06-27', heure: '23:00', domicile: 'Panama',  flagD: '🇵🇦', exterieur: 'England', flagE: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupe: 'L', stade: 'MetLife Stadium, New York/NJ' },
  { id: 72, date: '2026-06-27', heure: '23:00', domicile: 'Croatia', flagD: '🇭🇷', exterieur: 'Ghana',   flagE: '🇬🇭', groupe: 'L', stade: 'Lincoln Financial Field, Philadelphia' },
]

export const CDM_FIXTURES = CDM_FIXTURES_RAW.slice().sort((a, b) => {
  const ka = `${a.date}${a.heure}`
  const kb = `${b.date}${b.heure}`
  return ka < kb ? -1 : ka > kb ? 1 : 0
})

/**
 * Returns the group-stage matchday (1 | 2 | 3) for a given fixture.
 * J3 = simultaneous last round → key to detect potential stake management.
 */
export function getMatchday(fixtureId: number): 1 | 2 | 3 {
  const fixture = CDM_FIXTURES.find(f => f.id === fixtureId)
  if (!fixture) return 1
  const sorted = CDM_FIXTURES
    .filter(f => f.groupe === fixture.groupe)
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))
  const idx = sorted.findIndex(f => f.id === fixtureId)
  if (idx < 2) return 1
  if (idx < 4) return 2
  return 3
}
