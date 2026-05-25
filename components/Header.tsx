'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Logo from './Logo'

type DropdownItem = { href: string; label: string }

function NavDropdown({
  label,
  items,
  isActive,
}: {
  label: string
  items: DropdownItem[]
  isActive: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 transition-colors ${
          isActive ? 'text-emerald-400 font-semibold' : 'text-gray-400 hover:text-emerald-400'
        }`}
      >
        {label}
        <span className={`text-[10px] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl py-1 min-w-[160px] z-50 shadow-2xl">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const path = usePathname()

  const navItem = (href: string, label: string) => {
    const isActive = path.startsWith(href)
    return (
      <Link
        href={href}
        className={`transition-colors ${
          isActive ? 'text-emerald-400 font-semibold' : 'text-gray-400 hover:text-emerald-400'
        }`}
      >
        {label}
      </Link>
    )
  }

  const isFootActive   = path.startsWith('/cdm') || path.startsWith('/mls')
  const isBasketActive = path.startsWith('/nba')

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link href="/"><Logo /></Link>
      <nav className="flex gap-6 text-sm">
        {navItem('/signaux', '⚡ Signaux')}
        <NavDropdown
          label="⚽ Foot"
          isActive={isFootActive}
          items={[
            { href: '/cdm', label: '🌍 CdM 2026' },
            { href: '/mls', label: '🇺🇸 MLS'      },
          ]}
        />
        {navItem('/tennis', '🎾 Tennis')}
        <NavDropdown
          label="⚾ Baseball"
          isActive={path.startsWith('/mlb')}
          items={[
            { href: '/mlb', label: '⚾ MLB' },
          ]}
        />
        <NavDropdown
          label="🏀 Basket"
          isActive={isBasketActive}
          items={[
            { href: '/nba', label: '🏀 NBA Playoffs' },
          ]}
        />
        {navItem('/paris', '💰 Mes Paris')}
      </nav>
    </header>
  )
}
