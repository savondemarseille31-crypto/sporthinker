'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import Logo from './Logo'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type DropdownItem = { href: string; label: string }

function NavDropdown({ label, items, isActive }: { label: string; items: DropdownItem[]; isActive: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelClose = useCallback(() => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])
  const scheduleClose = useCallback(() => { closeTimer.current = setTimeout(() => setOpen(false), 150) }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => { document.removeEventListener('mousedown', handler); if (closeTimer.current) clearTimeout(closeTimer.current) }
  }, [])

  return (
    <div ref={ref} className="relative" onMouseEnter={() => { cancelClose(); setOpen(true) }} onMouseLeave={scheduleClose}>
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 transition-colors ${isActive ? 'text-emerald-400 font-semibold' : 'text-gray-400 hover:text-emerald-400'}`}>
        {label}
        <span className={`text-[10px] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-2 z-50" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-1.5 min-w-[180px] shadow-2xl">
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors rounded-lg mx-1">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const path = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    async function loadRole(userId: string) {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
      setIsAdmin(data?.role === 'admin')
    }
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      if (data.user) loadRole(data.user.id)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
      if (session?.user) loadRole(session.user.id)
      else setIsAdmin(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut()
    setEmail(null); setIsAdmin(false)
    router.push('/'); router.refresh()
  }

  const loggedIn = !!email

  const sportsActive  = ['/cdm', '/mlb', '/nba', '/tennis', '/mls'].some(p => path.startsWith(p))
  const espaceActive  = ['/paris', '/suivi', '/selections', '/admin'].some(p => path.startsWith(p))

  const espaceItems: DropdownItem[] = [
    { href: '/paris', label: '💰 Mes Paris' },
    { href: '/suivi', label: '📊 Suivi' },
    ...(isAdmin ? [
      { href: '/selections', label: '🎯 Sélections' },
      { href: '/admin', label: '🔐 Admin' },
    ] : []),
  ]

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link href={loggedIn ? '/signaux' : '/'}><Logo /></Link>

      <div className="flex items-center gap-4 md:gap-6">
        <nav className="flex gap-4 md:gap-6 text-sm items-center">
          {loggedIn ? (
            <>
              <Link href="/signaux" className={`transition-colors ${path === '/signaux' ? 'text-emerald-400 font-semibold' : 'text-gray-400 hover:text-emerald-400'}`}>Signaux</Link>
              <Link href="/signaux?tab=values" className="text-gray-400 hover:text-emerald-400 transition-colors">Values</Link>
              <Link href="/performance" className={`transition-colors ${path.startsWith('/performance') ? 'text-emerald-400 font-semibold' : 'text-gray-400 hover:text-emerald-400'}`}>Performance</Link>
              <NavDropdown label="Sports" isActive={sportsActive} items={[
                { href: '/cdm', label: '🌍 CdM 2026' },
                { href: '/mlb', label: '⚾ MLB' },
                { href: '/nba', label: '🏀 NBA' },
                { href: '/tennis', label: '🎾 Tennis' },
                { href: '/mls', label: '⚽ MLS' },
              ]} />
              <NavDropdown label="Mon espace" isActive={espaceActive} items={espaceItems} />
            </>
          ) : (
            <>
              <Link href="/performance" className={`transition-colors ${path.startsWith('/performance') ? 'text-emerald-400 font-semibold' : 'text-gray-400 hover:text-emerald-400'}`}>Performance</Link>
              <Link href="/#tarifs" className="text-gray-400 hover:text-emerald-400 transition-colors">Tarifs</Link>
            </>
          )}
        </nav>

        {loggedIn ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden md:inline max-w-[140px] truncate text-gray-400">{email}</span>
            <button onClick={signOut} className="text-gray-400 hover:text-emerald-400 transition-colors">Déconnexion</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-gray-400 hover:text-emerald-400 transition-colors">Connexion</Link>
            <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors">Inscription</Link>
          </div>
        )}
      </div>
    </header>
  )
}
