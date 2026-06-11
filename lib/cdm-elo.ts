// Static ELO ratings for all 48 CdM 2026 teams (source: eloratings.net, ~mid-2025)
// Keys must match the `pays` field in CDM_TEAM_PROFILES exactly.

export const CDM_ELO: Record<string, number> = {
  // Group A
  'Mexico':            1840,
  'South Korea':       1800,
  'South Africa':      1715,
  'Czechia':           1760,
  // Group B
  'Canada':            1735,
  'Switzerland':       1820,
  'Qatar':             1640,
  'Bosnia-Herzegovina':1705,
  // Group C
  'Brazil':            1995,
  'Morocco':           1910,
  'Scotland':          1745,
  'Haiti':             1590,
  // Group D
  'USA':               1855,
  'Paraguay':          1700,
  'Australia':         1705,
  'Turkey':            1780,
  // Group E
  'Germany':           1945,
  'Ecuador':           1760,
  'Ivory Coast':       1730,
  'Curaçao':           1580,
  // Group F
  'Netherlands':       1980,
  'Japan':             1815,
  'Tunisia':           1700,
  'Sweden':            1770,
  // Group G
  'Belgium':           1960,
  'Iran':              1700,
  'Egypt':             1710,
  'New Zealand':       1650,
  // Group H
  'Spain':             2030,
  'Uruguay':           1880,
  'Saudi Arabia':      1715,
  'Cape Verde':        1665,
  // Group I
  'France':            2055,
  'Senegal':           1840,
  'Norway':            1790,
  'Iraq':              1650,
  // Group J
  'Argentina':         2020,
  'Austria':           1795,
  'Algeria':           1755,
  'Jordan':            1620,
  // Group K
  'Portugal':          1975,
  'Colombia':          1900,
  'Uzbekistan':        1680,
  'DR Congo':          1655,
  // Group L
  'England':           2010,
  'Croatia':           1900,
  'Panama':            1655,
  'Ghana':             1695,
}

// Host nations get an atmospheric/crowd bonus applied in lambda computation
export const HOST_TEAMS = new Set(['USA', 'Canada', 'Mexico'])

export function getElo(pays: string): number {
  if (CDM_ELO[pays] !== undefined) return CDM_ELO[pays]
  // Fuzzy fallback
  const k = pays.toLowerCase()
  for (const [name, elo] of Object.entries(CDM_ELO)) {
    if (name.toLowerCase() === k) return elo
  }
  return 1700 // average neutral fallback
}

export function isHost(pays: string): boolean {
  return HOST_TEAMS.has(pays)
}
