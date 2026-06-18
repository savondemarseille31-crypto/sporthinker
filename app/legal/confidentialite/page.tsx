import LegalShell from '@/components/LegalShell'

export const metadata = { title: 'Politique de confidentialité' }

export default function ConfidentialitePage() {
  return (
    <LegalShell title="Politique de confidentialité (RGPD)" updated="juin 2026">
      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est <strong>[à compléter : raison sociale]</strong>, joignable à{' '}
        <strong>[à compléter : email de contact]</strong>.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Données de compte : adresse e-mail, identifiants de connexion.</li>
        <li>Données d&apos;abonnement et de paiement : gérées par <strong>Stripe</strong> (nous ne stockons aucune donnée bancaire complète).</li>
        <li>Données d&apos;usage : suivis de paris personnels que vous enregistrez, préférences, données techniques (logs).</li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>Fourniture du Service et gestion du compte (exécution du contrat).</li>
        <li>Facturation et gestion des abonnements (obligation légale / exécution du contrat).</li>
        <li>Amélioration et sécurité du Service (intérêt légitime).</li>
      </ul>

      <h2>4. Sous-traitants</h2>
      <ul>
        <li><strong>Supabase</strong> — base de données et authentification.</li>
        <li><strong>Stripe</strong> — traitement des paiements.</li>
        <li><strong>Vercel</strong> — hébergement de l&apos;application.</li>
      </ul>

      <h2>5. Durée de conservation</h2>
      <p>
        Les données sont conservées pour la durée de la relation contractuelle, puis archivées selon les obligations
        légales applicables, avant suppression.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation,
        d&apos;opposition et de portabilité. Pour les exercer : <strong>[à compléter : email]</strong>. Vous pouvez
        également introduire une réclamation auprès de la CNIL.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Le Service utilise des cookies strictement nécessaires à son fonctionnement et, le cas échéant, des cookies de
        mesure d&apos;audience soumis à votre consentement.
      </p>

      <p className="text-xs text-gray-500">[À compléter / faire valider par un juriste avant mise en production.]</p>
    </LegalShell>
  )
}
