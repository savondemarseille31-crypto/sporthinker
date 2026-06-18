-- ───────────────────────────────────────────────────────────────────────────
-- W3 — Persistance par compte : paris personnels + bankroll (isolés par RLS).
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor → New query → Run).
-- ───────────────────────────────────────────────────────────────────────────

-- Paris personnels de l'utilisateur
create table if not exists public.user_bets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  match        text not null default '',
  competition  text not null default '',
  type_pari    text not null default 'autre',
  selection    text not null default '',
  cote_stake   numeric not null default 2,
  prob_estimee numeric not null default 0,
  mise         numeric not null default 0,
  statut       text not null default 'en_cours',
  gain         numeric,
  notes        text
);

alter table public.user_bets enable row level security;

drop policy if exists "user_bets_all_own" on public.user_bets;
create policy "user_bets_all_own" on public.user_bets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists user_bets_user_idx on public.user_bets(user_id);

-- Bankroll de l'utilisateur (une ligne par compte)
create table if not exists public.user_bankroll (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  montant_initial numeric not null default 1000,
  montant_actuel  numeric not null default 1000,
  devise          text not null default '€',
  updated_at      timestamptz not null default now()
);

alter table public.user_bankroll enable row level security;

drop policy if exists "user_bankroll_all_own" on public.user_bankroll;
create policy "user_bankroll_all_own" on public.user_bankroll
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
