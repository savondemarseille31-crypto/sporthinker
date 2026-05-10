'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'

export default function Header() {
  const path = usePathname()

  const navItem = (href: string, label: string) => {
    const isActive = path.startsWith(href)
    return (
      <Link
        href={href}
        className={`transition-colors ${isActive ? 'text-emerald-400 font-semibold' : 'hover:text-emerald-400'}`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link href="/"><Logo /></Link>
      <nav className="flex gap-6 text-sm text-gray-400">
        {navItem('/cdm', '🌍 CdM 2026')}
        {navItem('/mlb', '⚾ MLB')}
        {navItem('/paris', '💰 Mes Paris')}
      </nav>
    </header>
  )
}
