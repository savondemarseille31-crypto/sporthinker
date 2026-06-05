/**
 * Classements des groupes CdM 2026 — API-Football (league=1, season=2026)
 * Fallback statique (0 pts) si l'API ne retourne rien (avant le 1er match).
 */

import { CDM_GROUPS } from './cdm-groups'

const API_KEY  = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

export type TeamStanding = {
  rank:          number
  team:          string
  pts:           number
  played:        number
  win:           number
  draw:          number
  lose:          number
  goalsFor:      number
  goalsAgainst:  number
  goalDiff:      number
  form:          string   // ex: "WDL"
}

export type GroupStandingData = {
  group:      string          // "A" … "L"
  standings:  TeamStanding[]
  live:       boolean         // true = données temps réel
}

// ── Fallback statique ────────────────────────────────────────────────────────

export function getStaticStandings(): GroupStandingData[] {
  return Object.entries(CDM_GROUPS).map(([g, { teams }], gi) => ({
    group: g,
    live:  false,
    standings: teams.map((team, i) => ({
      rank: i + 1, team,
      pts: 0, played: 0, win: 0, draw: 0, lose: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, form: '',
    })),
  }))
}

// ── Normalisation nom équipe ─────────────────────────────────────────────────

const API_NAME_MAP: Record<string, string> = {
  'Ivory Coast':          "Côte d'Ivoire",
  "Cote d'Ivoire":        'Ivory Coast',
  'Bosnia':               'Bosnia-Herzegovina',
  'Congo DR':             'DR Congo',
  'Korea Republic':       'South Korea',
  'South Korea':          'South Korea',
  'Czech Republic':       'Czechia',
  'Czechia':              'Czechia',
  'Iran':                 'Iran',
  'New Zealand':          'New Zealand',
  'Cape Verde':           'Cape Verde',
  'Saudi Arabia':         'Saudi Arabia',
}

function normTeam(name: string): string {
  return API_NAME_MAP[name] ?? name
}

// ── Fetch principal ──────────────────────────────────────────────────────────

export async function getCdMStandings(): Promise<GroupStandingData[]> {
  const fallback = getStaticStandings()
  if (!API_KEY) return fallback

  try {
    const res = await fetch(
      `${BASE_URL}/standings?league=1&season=2026`,
      { headers: { 'x-apisports-key': API_KEY }, next: { revalidate: 300 } },
    )
    if (!res.ok) return fallback

    const json = await res.json()
    const rawGroups: any[][] = json.response?.[0]?.league?.standings
    if (!rawGroups?.length) return fallback

    const result: GroupStandingData[] = rawGroups.map((group) => {
      const letter = (group[0]?.group as string ?? '').replace(/^Group\s*/i, '')
      return {
        group: letter,
        live:  true,
        standings: group.map((t: any) => ({
          rank:         t.rank        ?? 0,
          team:         normTeam(t.team?.name ?? ''),
          pts:          t.points      ?? 0,
          played:       t.all?.played ?? 0,
          win:          t.all?.win    ?? 0,
          draw:         t.all?.draw   ?? 0,
          lose:         t.all?.lose   ?? 0,
          goalsFor:     t.all?.goals?.for     ?? 0,
          goalsAgainst: t.all?.goals?.against ?? 0,
          goalDiff:     t.goalsDiff   ?? 0,
          form:         t.form        ?? '',
        })),
      }
    })

    // Vérifier qu'on a les 12 groupes ; compléter avec fallback si manquant
    const letters = new Set(result.map(g => g.group))
    const merged = fallback.map(fb =>
      letters.has(fb.group) ? result.find(r => r.group === fb.group)! : fb
    )
    return merged
  } catch {
    return fallback
  }
}
