// Exploration de l'API GraphQL Stake.bet
// Usage : STAKE_API_KEY=ta_clé npx tsx scripts/debug-stake.ts

const API_KEY = process.env.STAKE_API_KEY
const ENDPOINT = 'https://stake.bet/_api/graphql'

if (!API_KEY) {
  console.error('❌  STAKE_API_KEY manquant. Lance avec : STAKE_API_KEY=ta_clé npx tsx scripts/debug-stake.ts')
  process.exit(1)
}

async function gql(query: string, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json() as { data?: unknown; errors?: unknown }
  if (json.errors) {
    return { ok: false, errors: json.errors }
  }
  return { ok: true, data: json.data }
}

async function main() {
  console.log('\n=== Exploration API Stake.bet ===\n')

  // ── 1. Infos compte
  console.log('── 1. Infos compte (me) ──')
  const me = await gql(`{
    me {
      id
      name
      email
      createdAt
      roles { name }
      wallet {
        balance { amount currency { name } }
      }
    }
  }`)
  if (me.ok) {
    const user = (me.data as Record<string, unknown>).me as Record<string, unknown>
    console.log('✅ Authentification OK')
    console.log('   Nom      :', (user as Record<string, unknown>).name)
    console.log('   ID       :', (user as Record<string, unknown>).id)
    console.log('   Créé le  :', (user as Record<string, unknown>).createdAt)
  } else {
    console.log('❌ Échec — erreurs :', JSON.stringify(me.errors, null, 2))
  }

  // ── 2. Solde
  console.log('\n── 2. Solde ──')
  const wallet = await gql(`{
    me {
      wallet {
        balance { amount currency { name symbol } }
        totalBalance { amount currency { name } }
      }
    }
  }`)
  if (wallet.ok) {
    const data = (wallet.data as Record<string, unknown>).me as Record<string, unknown>
    console.log('✅ Solde :', JSON.stringify(data, null, 2))
  } else {
    console.log('❌', JSON.stringify(wallet.errors, null, 2))
  }

  // ── 3. Historique des paris
  console.log('\n── 3. Historique paris (10 derniers) ──')
  const bets = await gql(`{
    betList(first: 10) {
      edges {
        node {
          id
          status
          amount
          payout
          currency { name }
          createdAt
          ... on SportBet {
            outcomes {
              odds
              outcome {
                name
                market { name event { name sport { name } } }
              }
            }
          }
        }
      }
    }
  }`)
  if (bets.ok) {
    const edges = ((bets.data as Record<string, unknown>).betList as Record<string, unknown>).edges as unknown[]
    console.log(`✅ ${edges?.length ?? 0} paris récupérés`)
    if (edges?.length > 0) console.log('   Exemple :', JSON.stringify(edges[0], null, 2))
  } else {
    console.log('❌', JSON.stringify(bets.errors, null, 2))
  }

  // ── 4. Événements sportifs disponibles
  console.log('\n── 4. Événements sports disponibles ──')
  const sports = await gql(`{
    sportEvents(first: 5, filter: { status: UPCOMING }) {
      edges {
        node {
          id
          name
          sport { name slug }
          startTime
          markets(first: 2) {
            edges {
              node {
                name
                outcomes { name odds }
              }
            }
          }
        }
      }
    }
  }`)
  if (sports.ok) {
    const edges = ((sports.data as Record<string, unknown>).sportEvents as Record<string, unknown>)?.edges as unknown[]
    console.log(`✅ ${edges?.length ?? 0} événements récupérés`)
    if (edges?.length > 0) console.log('   Exemple :', JSON.stringify(edges[0], null, 2))
  } else {
    console.log('❌ sportEvents non disponible :', JSON.stringify(sports.errors, null, 2))
  }

  // ── 5. Cotes MLB (test ciblé)
  console.log('\n── 5. Cotes MLB ──')
  const mlb = await gql(`{
    sportEvents(first: 5, filter: { status: UPCOMING, sportSlug: "baseball" }) {
      edges {
        node {
          id
          name
          startTime
          markets(first: 3) {
            edges {
              node {
                name
                outcomes { name odds }
              }
            }
          }
        }
      }
    }
  }`)
  if (mlb.ok) {
    const edges = ((mlb.data as Record<string, unknown>).sportEvents as Record<string, unknown>)?.edges as unknown[]
    console.log(`✅ ${edges?.length ?? 0} matchs MLB`)
    for (const edge of edges ?? []) {
      const node = (edge as Record<string, unknown>).node as Record<string, unknown>
      console.log('  ', node.name, '—', node.startTime)
    }
  } else {
    console.log('❌', JSON.stringify(mlb.errors, null, 2))
  }

  console.log('\n=== Fin exploration ===\n')
}

main().catch(console.error)
