import LegalShell from '@/components/LegalShell'

export const metadata = { title: 'Jeu responsable' }

export default function JeuResponsablePage() {
  return (
    <LegalShell title="Jeu responsable" updated="juin 2026">
      <p>
        Les paris sportifs comportent un <strong>risque de perte d&apos;argent</strong> et peuvent entraîner une
        dépendance. SporThinker est un outil d&apos;analyse&nbsp;: il ne garantit aucun gain et n&apos;encourage pas à
        jouer au-delà de ses moyens.
      </p>

      <h2>Règles de bon sens</h2>
      <ul>
        <li>Ne jouez que de l&apos;argent que vous pouvez vous permettre de perdre.</li>
        <li>Fixez-vous un budget et des limites de temps, et tenez-vous-y.</li>
        <li>Ne cherchez jamais à « vous refaire » après une perte.</li>
        <li>Le jeu doit rester un loisir, pas une source de revenus.</li>
      </ul>

      <h2>Réservé aux 18 ans et plus</h2>
      <p>Le jeu d&apos;argent est interdit aux mineurs.</p>

      <h2>Besoin d&apos;aide ?</h2>
      <ul>
        <li>
          <strong>Joueurs Info Service</strong> : <a href="tel:0974751313">09 74 75 13 13</a> (appel non surtaxé,
          7j/7 de 8h à 2h).
        </li>
        <li>
          Possibilité de demander une <strong>interdiction volontaire de jeux</strong> auprès de l&apos;Autorité
          Nationale des Jeux (ANJ).
        </li>
      </ul>

      <p>
        SporThinker n&apos;est pas un opérateur de jeux d&apos;argent et ne prend aucun pari.
      </p>
    </LegalShell>
  )
}
