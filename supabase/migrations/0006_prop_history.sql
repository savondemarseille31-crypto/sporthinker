-- ───────────────────────────────────────────────────────────────────────────
-- Track record des PROPS joueurs CdM (buteur, tirs cadrés, carton jaune, passeur).
-- Capturés ex-ante puis soldés via les stats joueurs API-Football.
-- Écriture via service role (cron) ; lecture via service role (track record).
-- À exécuter dans l'éditeur SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.prop_history (
  id           text primary key,                  -- prop-{playerId}-{market}-{fixtureId}
  fixture_date text not null,                      -- YYYY-MM-DD
  pays         text not null,                      -- équipe du joueur
  player_name  text not null,
  market       text not null,                      -- buteur | tirs-cadrés | carton-jaune | passeur
  force        text,                               -- fort | modéré
  cote         numeric,
  statut       text not null default 'en_cours',   -- en_cours | gagné | perdu
  gain         numeric,
  captured_at  timestamptz not null default now(),
  settled_at   timestamptz
);

alter table public.prop_history enable row level security;
create index if not exists prop_history_statut_idx on public.prop_history(statut);
