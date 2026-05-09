const API_KEY = process.env.API_FOOTBALL_KEY!
const BASE_URL = 'https://v3.football.api-sports.io'

async function fetchAPI(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
    next: { revalidate: 3600 }
  })
  const data = await res.json()
  return data.response
}

// Équipes et groupes CdM 2026
export async function getCdmTeams() {
  return fetchAPI('/teams?league=1&season=2026')
}

// Matchs CdM 2026
export async function getCdmFixtures() {
  return fetchAPI('/fixtures?league=1&season=2026')
}

// Classement groupes CdM
export async function getCdmStandings() {
  return fetchAPI('/standings?league=1&season=2026')
}

// Cotes d'un match
export async function getOdds(fixtureId: number) {
  return fetchAPI(`/odds?fixture=${fixtureId}&bookmaker=6`)
}

// Stats d'une équipe
export async function getTeamStats(teamId: number) {
  return fetchAPI(`/teams/statistics?league=1&season=2026&team=${teamId}`)
}
