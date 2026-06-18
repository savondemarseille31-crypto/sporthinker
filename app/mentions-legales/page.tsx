import LegalShell from '@/components/LegalShell'

export const metadata = { title: 'Mentions légales' }

export default function MentionsLegalesPage() {
  return (
    <LegalShell title="Mentions légales" updated="juin 2026">
      <h2>Éditeur</h2>
      <p>
        <strong>[à compléter : raison sociale / nom]</strong><br />
        Statut : <strong>[à compléter : ex. micro-entreprise]</strong><br />
        SIREN / SIRET : <strong>[à compléter]</strong><br />
        Adresse : <strong>[à compléter]</strong><br />
        Contact : <strong>[à compléter : email]</strong><br />
        Directeur de la publication : <strong>[à compléter]</strong>
      </p>

      <h2>Hébergeur</h2>
      <p>
        Vercel Inc.<br />
        340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
        <a href="https://vercel.com" rel="noreferrer">vercel.com</a>
      </p>

      <h2>Nature du service</h2>
      <p>
        SporThinker est un outil d&apos;analyse statistique. Ce n&apos;est pas un opérateur de jeux d&apos;argent agréé
        et ne propose aucune prise de pari.
      </p>

      <p className="text-xs text-gray-500">[À compléter avec les informations de la structure juridique avant mise en production.]</p>
    </LegalShell>
  )
}
