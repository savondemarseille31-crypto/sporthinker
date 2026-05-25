// ESPN Unofficial Tennis API — aucune clé, aucun quota
// Rankings complétés par Jeff Sackmann (2200+ ATP / 1500+ WTA) quand curatedRank absent

import { getJSSRankings } from './jss-rankings'

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/tennis'

// ── Types ────────────────────────────────────────────────────────────────────

export type ESPNPlayer = {
  id: string
  name: string
  nationality: string   // "Spain", "France"...
  rank: number | null   // curatedRank ESPN — disponible pour ~top 50
}

export type ESPNMatch = {
  id: string
  date: string          // YYYY-MM-DD
  time: string          // HH:MM heure de Paris
  court: string
  tournament: string    // "Roland Garros", "Gonet Geneva Open"...
  isMajor: boolean
  bestOf: 3 | 5         // ATP Grand Slam = 5, sinon = 3
  surface: 'clay' | 'grass' | 'hard'
  tour: 'atp' | 'wta'
  status: 'scheduled' | 'live' | 'final'
  p1: ESPNPlayer        // home
  p2: ESPNPlayer        // away
  resultNote: string | null  // ex: "Alcaraz bt Sinner 6-4 6-2"
}

// ── Fetch ────────────────────────────────────────────────────────────────────

import { detectSurface } from './player-profiles'

async function fetchTour(
  tour: 'atp' | 'wta',
  date: string,
  jss: Awaited<ReturnType<typeof getJSSRankings>>,
): Promise<ESPNMatch[]> {
  const slug = tour === 'atp' ? 'mens-singles' : 'womens-singles'
  try {
    const dateKey = date.replace(/-/g, '')
    const res = await fetch(`${ESPN}/${tour}/scoreboard?dates=${dateKey}`, {
      next: { revalidate: 1800 },  // 30 min — programme peu modifié en journée
    })
    if (!res.ok) return []
    const data = await res.json()

    const out: ESPNMatch[] = []

    for (const event of data.events ?? []) {
      const tournament = event.name as string
      const isMajor    = Boolean(event.major)

      for (const grp of event.groupings ?? []) {
        if (grp.grouping.slug !== slug) continue

        for (const comp of grp.competitions ?? []) {
          // ESPN retourne tout le tournoi pour une fenêtre — on filtre par jour
          const compDay = (comp.startDate as string)?.slice(0, 10)
          if (compDay !== date) continue

          const st = comp.status?.type?.name as string
          const status: ESPNMatch['status'] | null =
            st === 'STATUS_SCHEDULED'   ? 'scheduled' :
            st === 'STATUS_IN_PROGRESS' ? 'live'      :
            st === 'STATUS_FINAL'       ? 'final'     : null
          if (!status) continue

          const cs  = (comp.competitors ?? []) as any[]
          const p1c = cs.find((c: any) => c.homeAway === 'home') ?? cs[0]
          const p2c = cs.find((c: any) => c.homeAway === 'away') ?? cs[1]
          if (!p1c || !p2c) continue

          const dt   = new Date(comp.startDate)
          const time = dt.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
          })

          const mkP = (c: any): ESPNPlayer => {
            const name        = c.athlete?.displayName ?? '?'
            const curatedRank = c.curatedRank?.current ?? null
            const jssRank     = curatedRank === null
              ? (tour === 'atp' ? jss.getAtpRank(name) : jss.getWtaRank(name))
              : null
            return {
              id:          String(c.id),
              name,
              nationality: c.athlete?.flag?.alt ?? '',
              rank:        curatedRank ?? jssRank,
            }
          }

          const note = (comp.notes as any[])?.find((n: any) => n.type === 'event')?.text ?? null

          out.push({
            id:         String(comp.id),
            date,
            time,
            court:      comp.venue?.court ?? comp.venue?.fullName ?? '',
            tournament,
            isMajor,
            bestOf:     tour === 'atp' && isMajor ? 5 : 3,
            surface:    detectSurface(tournament),
            tour,
            status,
            p1:         mkP(p1c),
            p2:         mkP(p2c),
            resultNote: note,
          })
        }
      }
    }

    return out
  } catch {
    return []
  }
}

// ── Export public ─────────────────────────────────────────────────────────────

export async function getESPNTennisSchedule(date: string): Promise<ESPNMatch[]> {
  const jss = await getJSSRankings().catch(() => ({
    getAtpRank: () => null,
    getWtaRank: () => null,
  }))

  const [atp, wta] = await Promise.all([
    fetchTour('atp', date, jss),
    fetchTour('wta', date, jss),
  ])
  const seen = new Set<string>()
  return [...atp, ...wta].filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}
