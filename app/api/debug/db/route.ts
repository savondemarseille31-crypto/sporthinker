import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  // Protection minimale
  const auth = request.headers.get('x-debug-key')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const info = {
    url_set:     !!url,
    url_prefix:  url?.slice(0, 30),
    anon_set:    !!anon,
    anon_prefix: anon?.slice(0, 20),
    svc_set:     !!svcKey,
    svc_prefix:  svcKey?.slice(0, 20),
  }

  if (!url || !svcKey) {
    return NextResponse.json({ error: 'Missing env vars', info })
  }

  try {
    const db = createClient(url, svcKey)
    const { data, error } = await db.from('selections_tracked').select('count').limit(1)
    return NextResponse.json({ ok: !error, error: error?.message, data, info })
  } catch (e) {
    return NextResponse.json({ error: String(e), info })
  }
}
