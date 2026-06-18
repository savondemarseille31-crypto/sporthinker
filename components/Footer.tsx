import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-800 bg-gray-950 text-xs text-gray-500">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <p className="max-w-2xl leading-relaxed">
            <span className="font-semibold text-gray-400">SporThinker</span> est un{' '}
            <span className="text-gray-400">outil d&apos;analyse statistique</span>. Ce n&apos;est pas un opérateur de
            jeux d&apos;argent et ne prend aucun pari. Les analyses ne garantissent aucun gain — les performances
            passées ne préjugent pas des résultats futurs.
          </p>
          <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gray-700 px-3 py-1 font-semibold text-gray-300">
            18+ • Jouer comporte des risques
          </span>
        </div>

        <p className="mt-4">
          Jeu responsable — Joueurs Info Service&nbsp;:{' '}
          <a href="tel:0974751313" className="text-gray-400 hover:text-emerald-400">09 74 75 13 13</a>{' '}
          (appel non surtaxé).
        </p>

        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/legal/cgu" className="hover:text-emerald-400">CGU</Link>
          <Link href="/legal/confidentialite" className="hover:text-emerald-400">Confidentialité</Link>
          <Link href="/legal/jeu-responsable" className="hover:text-emerald-400">Jeu responsable</Link>
          <Link href="/mentions-legales" className="hover:text-emerald-400">Mentions légales</Link>
        </nav>

        <p className="mt-4 text-gray-600">© {new Date().getFullYear()} SporThinker</p>
      </div>
    </footer>
  )
}
