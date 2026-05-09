import Link from 'next/link'
import Logo from '@/components/Logo'
import CalendrierClient from './CalendrierClient'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'

export default function CalendrierPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <nav className="flex gap-6 text-sm text-gray-400">
          <Link href="/cdm" className="text-emerald-400 font-semibold">🌍 CdM 2026</Link>
          <Link href="/nba" className="hover:text-emerald-400 transition-colors">🏀 NBA</Link>
          <Link href="/paris" className="hover:text-emerald-400 transition-colors">💰 Mes Paris</Link>
        </nav>
      </header>

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-emerald-400 transition-colors">← Retour CdM 2026</Link>
          <h1 className="text-4xl font-bold mt-2 mb-1">Calendrier CdM 2026</h1>
          <p className="text-gray-400">Phase de groupes · Du 11 juin au 27 juin 2026 · {CDM_FIXTURES.length} matchs</p>
        </div>
        <CalendrierClient fixtures={CDM_FIXTURES} />
      </div>
    </main>
  )
}
