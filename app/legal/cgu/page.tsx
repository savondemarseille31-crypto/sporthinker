import LegalShell from '@/components/LegalShell'

export const metadata = { title: 'Conditions Générales d’Utilisation et de Vente' }

export default function CGUPage() {
  return (
    <LegalShell title="Conditions Générales d'Utilisation et de Vente" updated="juin 2026">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent l&apos;accès et l&apos;utilisation du service <strong>Deltavyn</strong>{' '}
        (le « Service »), un <strong>outil d&apos;analyse statistique</strong> à destination des paris sportifs.
        Deltavyn n&apos;est pas un opérateur de jeux d&apos;argent, ne prend aucun pari et ne reçoit aucune mise.
      </p>

      <h2>2. Nature du Service — absence de garantie</h2>
      <p>
        Le Service fournit des analyses, signaux et outils d&apos;aide à la décision. Il ne constitue ni un conseil en
        investissement, ni une garantie de gain. <strong>Les performances passées ne préjugent pas des résultats
        futurs.</strong> L&apos;utilisateur reste seul décisionnaire et responsable de ses éventuels paris.
      </p>

      <h2>3. Accès et compte</h2>
      <p>
        L&apos;accès à certaines fonctionnalités requiert la création d&apos;un compte. L&apos;utilisateur s&apos;engage à
        fournir des informations exactes et à préserver la confidentialité de ses identifiants. Le Service est réservé
        aux personnes <strong>âgées de 18 ans ou plus</strong>.
      </p>

      <h2>4. Abonnement, paiement et résiliation</h2>
      <ul>
        <li>L&apos;abonnement est souscrit via notre prestataire de paiement (Stripe) et se renouvelle automatiquement à échéance.</li>
        <li>Les prix sont indiqués sur la page Tarifs, taxes applicables incluses.</li>
        <li>L&apos;abonnement peut être résilié à tout moment depuis l&apos;espace client ; l&apos;accès reste actif jusqu&apos;à la fin de la période en cours.</li>
        <li>
          Conformément à l&apos;article L.221-28 du Code de la consommation, l&apos;utilisateur reconnaît qu&apos;en
          accédant immédiatement au contenu numérique, il renonce à son droit de rétractation.
        </li>
      </ul>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus, analyses, modèles et éléments du Service est protégé. Toute reproduction ou
        rediffusion non autorisée, notamment des signaux, est interdite.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        Le Service est fourni « en l&apos;état ». Deltavyn ne saurait être tenu responsable des pertes liées aux
        paris de l&apos;utilisateur, ni de l&apos;indisponibilité de données fournies par des tiers.
      </p>

      <h2>7. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans notre <a href="/legal/confidentialite">Politique de confidentialité</a>.
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. À défaut de résolution amiable, les tribunaux
        français sont compétents.
      </p>

      <p className="text-xs text-gray-500">[À compléter / faire valider par un juriste avant mise en production.]</p>
    </LegalShell>
  )
}
