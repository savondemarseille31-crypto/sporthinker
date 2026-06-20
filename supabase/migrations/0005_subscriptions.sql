-- ───────────────────────────────────────────────────────────────────────────
-- W4 — Abonnements Stripe : source de vérité des droits premium.
-- Écriture via le webhook (service role) ; lecture par l'utilisateur (RLS).
-- À exécuter dans l'éditeur SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text,                              -- monthly | annual
  status                 text not null default 'inactive',  -- active | trialing | past_due | canceled | inactive
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- L'utilisateur lit son propre abonnement ; l'écriture se fait via le webhook (service role).
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
