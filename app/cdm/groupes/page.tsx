import Link from 'next/link'
import Header from '@/components/Header'
import { getCdMStandings } from '@/lib/cdm-standings'
import GroupesClient from '@/components/GroupesClient'

export const revalidate = 300  // refresh classements toutes les 5 min

export default async function GroupesPage() {
  const standings = await getCdMStandings()

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <Header />

      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/cdm" className="text-gray-500 text-sm hover:text-violet-400 transition-colors">← Retour CdM 2026</Link>
          <h1 className="text-4xl font-bold mt-2 mb-1">Groupes CdM 2026</h1>
          <p className="text-gray-400">12 groupes · 48 équipes · USA, Canada, Mexique</p>
        </div>

        <GroupesClient standings={standings} />
      </div>
    </main>
  )
}
