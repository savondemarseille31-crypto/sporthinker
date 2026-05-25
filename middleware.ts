import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth'

// Routes nécessitant une session admin valide
const PROTECTED_PREFIXES = ['/admin', '/api/stake']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // La page de login elle-même reste accessible
  if (pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    console.error('SESSION_SECRET manquant dans les variables d\'environnement')
    return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
  }

  if (!token || !(await verifySessionToken(token, secret))) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/stake/:path*'],
}
