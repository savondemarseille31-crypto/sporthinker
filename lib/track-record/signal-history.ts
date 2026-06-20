import { createClient } from '@supabase/supabase-js'
import type { TrackEntry } from './index'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Signaux du modèle capturés puis soldés (signal_history) → entrées de track record.
// Alimente /performance automatiquement, tous sports, par sport × niveau de confiance.
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getSignalHistoryTrackEntries(): Promise<TrackEntry[]> {
  const { data, error } = await db()
    .from('signal_history')
    .select('id,date_match,sport,force,tier,match,selection,cote,statut')
    .in('statut', ['gagné', 'perdu'])
  if (error || !data) return []
  return (data as any[]).map((r): TrackEntry => {
    const [dom, ext] = (r.match ?? '').split(' vs ').map((s: string) => s.trim())
    return {
      id: `sh-${r.id}`,
      date: r.date_match,
      sport: r.sport,
      equipe_dom: dom ?? '',
      equipe_ext: ext ?? '',
      match: r.match,
      selection: r.selection,
      cote: Number(r.cote),
      resultat: r.statut === 'gagné' ? 'won' : 'lost',
      tier: r.tier === 'value' ? 'value' : 'signal',
      confiance: r.force ?? null,
    }
  })
}
/* eslint-enable @typescript-eslint/no-explicit-any */
