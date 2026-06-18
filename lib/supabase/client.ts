import { createBrowserClient } from '@supabase/ssr'

// Client Supabase navigateur (composants 'use client') — utilise la clé publique anon.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
