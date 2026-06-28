import { getWcResults } from '@/lib/api-football'
import { generateCdMSignalsForMatch } from '@/lib/football-signals'
import { findEvent, devigFromEvent, type OddsEvent } from '@/lib/odds-api'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'
import type { Signal } from '@/lib/signals'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Noms API-Football → noms canoniques CdM (pour l'ELO et les drapeaux).
const ALIAS: Record<string, string> = {
  turkiye: 'turkey', cotedivoire: 'ivorycoast', korearepublic: 'southkorea', korea: 'southkorea',
  unitedstates: 'usa', czechrepublic: 'czechia', bosniaandherzegovina: 'bosniaherzegovina',
  congodr: 'drcongo', capeverdeislands: 'capeverde',
}
function normTeam(s: string): string {
  let n = (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
  n = n.replace(/^republicof/, '').replace(/republic$/, '')
  return ALIAS[n] ?? n
}
const CANON: Record<string, string> = {}
const FLAG: Record<string, string> = {}
for (const f of CDM_FIXTURES) {
  CANON[normTeam(f.domicile)] = f.domicile; FLAG[normTeam(f.domicile)] = f.flagD
  CANON[normTeam(f.exterieur)] = f.exterieur; FLAG[normTeam(f.exterieur)] = f.flagE
}
const canon = (n: string) => CANON[normTeam(n)] ?? n
const flagOf = (n: string) => FLAG[normTeam(n)] ?? '🏳️'

// Signaux Dixon-Coles pour les matchs de PHASE FINALE à venir (matchups dynamiques API-Football,
// pas dans CDM_FIXTURES). Permet aux 16es/quarts/etc. d'avoir des signaux + d'être capturés/suivis.
export async function getKnockoutCdMSignals(cdmOdds: OddsEvent[]): Promise<Signal[]> {
  const api = await getWcResults().catch(() => [] as any[])
  const now = new Date()
  const limit = new Date(now); limit.setDate(now.getDate() + 14)
  const ko = (api as any[])
    .filter(f => !/group/i.test(f.league.round))
    .filter(f => { const dt = new Date(f.fixture.date); return dt >= now && dt <= limit })
  return ko.flatMap(f => {
    const dt = new Date(f.fixture.date)
    const date = dt.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })          // YYYY-MM-DD (Paris)
    const heure = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
    const dom = canon(f.teams.home.name), ext = canon(f.teams.away.name)
    const ev = cdmOdds.length ? findEvent(cdmOdds, dom, ext) : null
    return generateCdMSignalsForMatch({
      id: 900000 + (f.fixture?.id ?? 0),  // id distinct (évite collision avec les fixtures de poules 1–72)
      date, heure, domicile: dom, exterieur: ext,
      devigged: ev ? devigFromEvent(ev, dom, ext) : undefined,
    }).map(s => ({ ...s, flagDom: flagOf(dom), flagExt: flagOf(ext) }))
  })
}
