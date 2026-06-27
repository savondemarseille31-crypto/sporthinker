import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export type PropMarketStat = { market: string; label: string; n: number; wins: number; winRate: number }

const LABELS: Record<string, string> = {
  'buteur':       '⚽ Buteur',
  'tirs-cadrés':  '🎯 Tir cadré',
  'carton-jaune': '🟨 Carton jaune',
  'passeur':      '🅰️ Passeur',
}

// Taux de réussite des props joueurs CdM soldés, par marché.
// (Réussite plutôt que yield : les cotes props ne sont pas toujours dispo → on publie
//  d'abord le hit rate, plus honnête tant que l'échantillon est court.)
export async function getPropStats(): Promise<{ markets: PropMarketStat[]; total: number }> {
  const { data, error } = await db()
    .from('prop_history')
    .select('market,statut')
    .in('statut', ['gagné', 'perdu'])
  if (error || !data) return { markets: [], total: 0 }

  const markets: PropMarketStat[] = []
  for (const [market, label] of Object.entries(LABELS)) {
    const rs = data.filter(r => r.market === market)
    if (!rs.length) continue
    const wins = rs.filter(r => r.statut === 'gagné').length
    markets.push({ market, label, n: rs.length, wins, winRate: Math.round((wins / rs.length) * 100) })
  }
  return { markets, total: data.length }
}
