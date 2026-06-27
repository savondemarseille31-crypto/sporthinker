import Link from 'next/link'
import Header from '@/components/Header'
import CalendrierClient from './CalendrierClient'
import { CDM_FIXTURES } from '@/lib/cdm-fixtures'

export default function CalendrierPage() {
  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">← Retour CdM 2026</Link>
          <h1 className="text-4xl font-bold mt-2 mb-1">Calendrier CdM 2026</h1>
          <p className="text-gray-400">Phase de groupes · Du 11 juin au 27 juin 2026 · {CDM_FIXTURES.length} matchs</p>
        </div>
        <CalendrierClient fixtures={CDM_FIXTURES} />
      </div>
    </main>
  )
}
