-- ───────────────────────────────────────────────────────────────────────────
-- Capture automatique des signaux du modèle (tous sports) → track record /performance.
-- Un snapshot quotidien des signaux publiés, auto-soldé ensuite. Lecture via service role.
-- À exécuter dans l'éditeur SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.signal_history (
  id          text primary key,                 -- clé stable (signal.id + date) → dédup
  date_match  text not null,                     -- YYYY-MM-DD
  sport       text not null,                     -- MLB | Tennis | NBA | MLS | CdM
  force       text,                              -- fort | modéré | à surveiller
  tier        text not null default 'signal',    -- signal | value
  match       text not null,
  selection   text not null,                     -- pari recommandé
  cote        numeric,
  statut      text not null default 'en_cours',  -- en_cours | gagné | perdu
  gain        numeric,                            -- en unités (mise à plat 1u)
  captured_at timestamptz not null default now(),
  settled_at  timestamptz
);

alter table public.signal_history enable row level security;
-- Pas de policy publique : lecture/écriture uniquement via la clé service role (serveur).
create index if not exists signal_history_sport_idx on public.signal_history(sport);
create index if not exists signal_history_statut_idx on public.signal_history(statut);
