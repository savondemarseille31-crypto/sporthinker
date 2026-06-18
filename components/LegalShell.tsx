import Header from './Header'

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Header />
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {updated && <p className="text-xs text-gray-500 mb-8">Dernière mise à jour : {updated}</p>}
        <div className="space-y-4 text-sm leading-relaxed text-gray-300 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-emerald-400 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-white">
          {children}
        </div>
      </div>
    </main>
  )
}
