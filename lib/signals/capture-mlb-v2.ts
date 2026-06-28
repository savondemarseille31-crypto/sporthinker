import { createClient } from '@supabase/supabase-js'
import { getSchedule } from '@/lib/mlb-api'
import { analyzeGameV2 } from '@/lib/mlb-v2-signals'
import type { Signal } from '@/lib/signals'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Capture des signaux MLB v2 (proba Pythagoricienne + Kelly) dans signal_history sous le
// sport "MLB v2" → mesurés et suivis SÉPARÉMENT du v1, pour comparer les deux modèles.
export async function captureTodayMlbV2(): Promise<{ captured: number }> {
  const games = await getSchedule().catch(() => [])
  const preview = games.filter(g => g.status?.abstractGameState === 'Preview')
  const analyses = await Promise.all(
    preview.map(g => analyzeGameV2(g).catch(() => ({ signal: null as Signal | null }))),
  )
  const seen = new Set<string>()
  const rows = analyses
    .map(a => a?.signal)
    .filter((s): s is Signal => !!s && !!s.id && !seen.has(s.id) && seen.add(s.id))
    .map(s => ({
      id:         `mlbv2-${s.id}`,
      date_match: s.date,
      sport:      'MLB v2',
      force:      s.force ?? null,
      tier:       'signal',
      match:      s.match,
      selection:  s.pari,
      cote:       s.coteRef ?? null,
      statut:     'en_cours',
    }))
  if (!rows.length) return { captured: 0 }
  const { error } = await db().from('signal_history').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) {
    console.error('[capture-mlb-v2] signal_history upsert error:', error.message)
    return { captured: 0 }
  }
  return { captured: rows.length }
}
