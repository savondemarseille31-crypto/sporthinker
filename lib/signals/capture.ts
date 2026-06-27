import { createClient } from '@supabase/supabase-js'
import { getTodaySignals } from './today'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Snapshot des signaux du jour (tous sports + values) → signal_history.
// Dédup par id (ignoreDuplicates) : la 1re capture fait foi (preuve ex-ante).
export async function captureTodaySignals(): Promise<{ captured: number }> {
  const { signaux, values } = await getTodaySignals()
  const seen = new Set<string>()
  const rows = [...signaux, ...values]
    .filter(s => s.id && !seen.has(s.id) && seen.add(s.id))
    .map(s => ({
      id:         s.id,
      date_match: s.date,
      sport:      s.sport,
      force:      s.force ?? null,
      tier:       s.tier === 'value' ? 'value' : 'signal',
      match:      s.match,
      selection:  s.pari,
      cote:       s.coteRef ?? null,
      statut:     'en_cours',
    }))
  if (!rows.length) return { captured: 0 }

  const { error } = await db()
    .from('signal_history')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) {
    console.error('[capture] signal_history upsert error:', error.message)
    return { captured: 0 }
  }
  return { captured: rows.length }
}
