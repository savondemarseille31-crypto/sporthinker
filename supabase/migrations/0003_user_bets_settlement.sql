-- ───────────────────────────────────────────────────────────────────────────
-- Auto-soldage : on ajoute le sport et la date du match aux paris, pour pouvoir
-- récupérer le bon résultat et solder automatiquement.
-- À exécuter dans l'éditeur SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.user_bets add column if not exists sport      text;
alter table public.user_bets add column if not exists match_date text; -- YYYY-MM-DD
