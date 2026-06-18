import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes internes réservées (le contrôle fin du rôle 'admin' est fait dans les layouts).
const PROTECTED = ['/admin', '/api/stake', '/selections']

export async function middleware(request: NextRequest) {
  // Rafraîchit la session Supabase à chaque requête et récupère l'utilisateur.
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Toutes les routes sauf les assets statiques (pour rafraîchir la session partout).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
